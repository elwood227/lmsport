import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const courses = await sql`SELECT id, title, description, teacher_id, created_at FROM courses ORDER BY created_at DESC`
    return NextResponse.json(courses)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, teacherId } = await request.json()
    if (!title || !teacherId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [course] = await sql`
      INSERT INTO courses (title, description, teacher_id)
      VALUES (${title}, ${description || null}, ${teacherId})
      RETURNING id, title, description, teacher_id, created_at
    `
    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, description } = await request.json()
    if (!id || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [course] = await sql`
      UPDATE courses SET title = ${title}, description = ${description || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, description, teacher_id, created_at
    `
    return NextResponse.json(course)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM courses WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
