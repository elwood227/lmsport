import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const lessons = await sql`
      SELECT id, course_id, title, content, order_index, created_at
      FROM lessons WHERE course_id = ${parseInt(courseId)} ORDER BY order_index ASC
    `
    return NextResponse.json(lessons)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { courseId, title, content, orderIndex } = await request.json()
    if (!courseId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [lesson] = await sql`
      INSERT INTO lessons (course_id, title, content, order_index)
      VALUES (${courseId}, ${title}, ${content || null}, ${orderIndex || 0})
      RETURNING id, course_id, title, content, order_index, created_at
    `
    return NextResponse.json(lesson)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, content, orderIndex } = await request.json()
    if (!id || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [lesson] = await sql`
      UPDATE lessons SET title = ${title}, content = ${content || null}, order_index = ${orderIndex ?? 0}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, course_id, title, content, order_index, created_at
    `
    return NextResponse.json(lesson)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM lessons WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
