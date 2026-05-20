import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const lessonId = request.nextUrl.searchParams.get('lessonId')
    if (!lessonId) return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const questions = await sql`SELECT id, lesson_id, question_text, created_at FROM quiz_questions WHERE lesson_id = ${parseInt(lessonId)}`
    const questionsWithAnswers = await Promise.all(
      questions.map(async (q: any) => {
        const answers = await sql`SELECT id, question_id, answer_text, is_correct FROM quiz_answers WHERE question_id = ${q.id}`
        return { ...q, answers }
      })
    )
    return NextResponse.json(questionsWithAnswers)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { lessonId, questionText, answers } = await request.json()
    if (!lessonId || !questionText || !answers?.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    const [q] = await sql`INSERT INTO quiz_questions (lesson_id, question_text) VALUES (${lessonId}, ${questionText}) RETURNING id`
    await Promise.all(answers.map((a: any) => sql`INSERT INTO quiz_answers (question_id, answer_text, is_correct) VALUES (${q.id}, ${a.text}, ${a.isCorrect})`))
    return NextResponse.json({ id: q.id, questionText, answers })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, questionText, answers } = await request.json()
    if (!id || !questionText) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    await sql`UPDATE quiz_questions SET question_text = ${questionText} WHERE id = ${id}`
    if (answers?.length) {
      await sql`DELETE FROM quiz_answers WHERE question_id = ${id}`
      await Promise.all(answers.map((a: any) => sql`INSERT INTO quiz_answers (question_id, answer_text, is_correct) VALUES (${id}, ${a.text}, ${a.isCorrect})`))
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM quiz_questions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
