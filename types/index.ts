export interface User {
  id: number
  name: string
  email: string
  userType: 'teacher' | 'student'
}

export interface UserState {
  isAuthenticated: boolean
  userType: 'teacher' | 'student' | null
  name: string | null
  id: number | null
  email: string | null
}

export interface Course {
  id: number
  title: string
  description: string | null
  teacher_id: number
  created_at: string
}

export interface Lesson {
  id: number
  course_id: number
  title: string
  content: string | null
  order_index: number
  created_at: string
}

export interface QuizQuestion {
  id: number
  lesson_id: number
  question_text: string
  created_at: string
  answers?: QuizAnswer[]
}

export interface QuizAnswer {
  id: number
  question_id: number
  answer_text: string
  is_correct: boolean
  created_at?: string
}

export interface UserProgress {
  id: number
  user_id: number
  lesson_id: number
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface QuizAttempt {
  id: number
  user_id: number
  question_id: number
  selected_answer_id: number | null
  is_correct: boolean | null
  attempted_at: string
}
