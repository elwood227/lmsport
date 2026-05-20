export async function apiCall(
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

export async function getCourses() {
  return apiCall('/api/courses')
}

export async function createCourse(title: string, description: string, teacherId: number) {
  return apiCall('/api/courses', {
    method: 'POST',
    body: JSON.stringify({ title, description, teacherId }),
  })
}

export async function getLessons(courseId: number) {
  return apiCall(`/api/lessons?courseId=${courseId}`)
}

export async function createLesson(
  courseId: number,
  title: string,
  content: string,
  orderIndex: number
) {
  return apiCall('/api/lessons', {
    method: 'POST',
    body: JSON.stringify({ courseId, title, content, orderIndex }),
  })
}

export async function getQuiz(lessonId: number) {
  return apiCall(`/api/quiz?lessonId=${lessonId}`)
}

export async function createQuizQuestion(
  lessonId: number,
  questionText: string,
  answers: Array<{ text: string; isCorrect: boolean }>
) {
  return apiCall('/api/quiz', {
    method: 'POST',
    body: JSON.stringify({ lessonId, questionText, answers }),
  })
}

export async function submitQuizAnswer(userId: number, questionId: number, answerId: number) {
  return apiCall('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ userId, questionId, answerId }),
  })
}
