import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    const type = request.nextUrl.searchParams.get('type')

    const sql = neon(process.env.DATABASE_URL!)

    if (type === 'progress') {
      const user = await sql`SELECT id, name, email FROM users WHERE id = ${userId}`
      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const courses = await sql`SELECT id, title FROM courses`

      const courseProgress = await Promise.all(
        courses.map(async (course: any) => {
          const lessons = await sql`
            SELECT id FROM lessons WHERE course_id = ${course.id}
          `

          const progress = await sql`
            SELECT up.lesson_id FROM user_progress up
            JOIN lessons l ON up.lesson_id = l.id
            WHERE up.user_id = ${userId} AND l.course_id = ${course.id} AND up.completed = true
          `

          // Count quiz attempts for this course via questions → lessons
          const attempts = await sql`
            SELECT qa.is_correct FROM quiz_attempts qa
            JOIN quiz_questions qq ON qa.question_id = qq.id
            JOIN lessons l ON qq.lesson_id = l.id
            WHERE qa.user_id = ${userId} AND l.course_id = ${course.id}
          `

          const totalAttempts = attempts.length
          const correctAttempts = attempts.filter((a: any) => a.is_correct).length
          const avgScore = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

          return {
            courseId: course.id,
            courseTitle: course.title,
            lessonsCompleted: progress.length,
            totalLessons: lessons.length,
            testsCompleted: totalAttempts,
            averageScore: avgScore,
          }
        })
      )

      const filtered = courseProgress.filter((cp: any) => cp.totalLessons > 0)
      const totalLessonsCompleted = filtered.reduce((sum: number, cp: any) => sum + cp.lessonsCompleted, 0)
      const totalTests = filtered.reduce((sum: number, cp: any) => sum + cp.testsCompleted, 0)
      const avgScore = filtered.length > 0
        ? Math.round(filtered.reduce((sum: number, cp: any) => sum + cp.averageScore, 0) / filtered.length)
        : 0

      return NextResponse.json({
        user: { id: user[0].id, name: user[0].name, email: user[0].email },
        courseProgress: filtered,
        stats: {
          totalCourses: filtered.length,
          totalLessonsCompleted,
          totalTests,
          averageScore: avgScore,
        },
      })
    }

    const user = await sql`
      SELECT id, email, name, user_type FROM users WHERE id = ${userId}
    `
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      userType: user[0].user_type,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { name, email, userType } = await request.json()
    if (!name || !email || !userType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [user] = await sql`
      UPDATE users SET name = ${name}, email = ${email}, user_type = ${userType}, updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, name, email, user_type
    `
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, userType: user.user_type })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM users WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
