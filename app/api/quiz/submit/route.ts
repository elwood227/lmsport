import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, questionId, answerId } = await request.json()

    if (!userId || !questionId || !answerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Get the answer to check if it's correct
    const answerResult = await sql`
      SELECT is_correct FROM quiz_answers WHERE id = ${answerId}
    `

    if (answerResult.length === 0) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      )
    }

    const isCorrect = answerResult[0].is_correct

    // Record the attempt
    await sql`
      INSERT INTO quiz_attempts (user_id, question_id, selected_answer_id, is_correct)
      VALUES (${userId}, ${questionId}, ${answerId}, ${isCorrect})
    `

    return NextResponse.json({ isCorrect })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
