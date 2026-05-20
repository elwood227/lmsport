import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

// Expected JSON structure:
// {
//   "title": "Название курса",
//   "description": "Описание",
//   "lessons": [
//     {
//       "title": "Урок 1",
//       "content": "Текст урока",
//       "order_index": 1,
//       "questions": [
//         {
//           "text": "Вопрос?",
//           "answers": [
//             { "text": "Вариант 1", "correct": true },
//             { "text": "Вариант 2", "correct": false }
//           ]
//         }
//       ]
//     }
//   ]
// }

export async function POST(request: NextRequest) {
  try {
    const { course, teacherId } = await request.json()

    if (!course?.title || !teacherId) {
      return NextResponse.json({ error: 'Missing course title or teacherId' }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Create course
    const [createdCourse] = await sql`
      INSERT INTO courses (title, description, teacher_id)
      VALUES (${course.title}, ${course.description || null}, ${teacherId})
      RETURNING id, title
    `

    const results = { courseId: createdCourse.id, lessons: 0, questions: 0 }

    for (const lesson of (course.lessons || [])) {
      const [createdLesson] = await sql`
        INSERT INTO lessons (course_id, title, content, order_index)
        VALUES (${createdCourse.id}, ${lesson.title}, ${lesson.content || null}, ${lesson.order_index || 0})
        RETURNING id
      `
      results.lessons++

      for (const q of (lesson.questions || [])) {
        const [createdQ] = await sql`
          INSERT INTO quiz_questions (lesson_id, question_text)
          VALUES (${createdLesson.id}, ${q.text})
          RETURNING id
        `
        results.questions++

        for (const a of (q.answers || [])) {
          await sql`
            INSERT INTO quiz_answers (question_id, answer_text, is_correct)
            VALUES (${createdQ.id}, ${a.text}, ${a.correct ?? false})
          `
        }
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
