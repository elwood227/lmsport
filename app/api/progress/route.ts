import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, lessonId } = await request.json()

    if (!userId || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO user_progress (user_id, lesson_id, completed, completed_at)
      VALUES (${userId}, ${lessonId}, true, NOW())
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const courseId = request.nextUrl.searchParams.get('courseId')

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    const progress = await sql`
      SELECT up.lesson_id FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      WHERE up.user_id = ${parseInt(userId)} AND l.course_id = ${parseInt(courseId)} AND up.completed = true
    `

    return NextResponse.json({ completedLessons: progress.map((p: any) => p.lesson_id) })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
