import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const users = await sql`SELECT id, email, name, user_type FROM users ORDER BY created_at DESC`
    return NextResponse.json({ users: users.map((u: any) => ({ id: u.id, email: u.email, name: u.name, userType: u.user_type })) })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, userType } = await request.json()
    if (!name || !email || !password || !userType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    const hash = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, user_type)
      VALUES (${name}, ${email}, ${hash}, ${userType})
      RETURNING id, name, email, user_type
    `
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, userType: user.user_type })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
