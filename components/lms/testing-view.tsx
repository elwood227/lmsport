'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import { QuizAnswer, QuizQuestion, UserState } from '@/types'

interface TestingViewProps {
  onLogout: () => void
  user: UserState
  lessonId: number | null
  onBack: () => void
}

export function TestingView({ user, lessonId, onBack }: TestingViewProps) {
  const [questions, setQuestions] = useState<Array<QuizQuestion & { answers: QuizAnswer[] }>>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [testCompleted, setTestCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState('')
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    if (!lessonId) return
    setQuestions([]); setCurrentQuestion(0); setSelectedAnswer(null)
    setAnswered(false); setScore(0); setTestCompleted(false)
    setError(''); setIsCurrentCorrect(null)
    loadQuiz()
  }, [lessonId])

  const loadQuiz = async () => {
    if (!lessonId) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/quiz?lessonId=${lessonId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuestions(data)
      if (!Array.isArray(data) || data.length === 0) setError('Для этого урока ещё нет вопросов.')
    } catch {
      setError('Не удалось загрузить вопросы. Попробуйте позже.')
    }
    setLoading(false)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !user.id || !questions[currentQuestion]) return
    setLoadingSubmit(true)
    try {
      const question = questions[currentQuestion]
      const answer = question.answers[selectedAnswer]
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, questionId: question.id, answerId: answer.id }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.isCorrect) setScore(s => s + 1)
      setIsCurrentCorrect(data.isCorrect)
      setAnswered(true)
    } catch {
      setError('Не удалось отправить ответ.')
    }
    setLoadingSubmit(false)
  }

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(c => c + 1)
      setSelectedAnswer(null); setAnswered(false); setIsCurrentCorrect(null); setError('')
    } else {
      setTestCompleted(true)
    }
  }

  const handleRetry = () => {
    setCurrentQuestion(0); setSelectedAnswer(null); setAnswered(false)
    setScore(0); setTestCompleted(false); setIsCurrentCorrect(null); setError('')
  }

  // Loading state
  if (!lessonId || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          {loading ? (
            <>
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Загрузка теста...</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold mb-4">Урок не выбран</p>
              <Button onClick={onBack} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                Вернуться к урокам
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <p className="text-slate-300">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={loadQuiz} className="h-11 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
                <RotateCcw size={16} className="mr-2" /> Повторить
              </Button>
              <Button onClick={onBack} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                <ArrowLeft size={16} className="mr-2" /> Назад к уроку
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (testCompleted) {
    const pct = Math.round((score / questions.length) * 100)
    const passed = pct >= 70
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          {/* Result card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              {passed
                ? <CheckCircle size={32} className="text-emerald-400" />
                : <XCircle size={32} className="text-amber-400" />}
            </div>
            <h1 className="text-2xl font-bold mb-1">{passed ? 'Тест пройден!' : 'Тест завершён'}</h1>
            <p className="text-slate-400 text-sm">{passed ? 'Отличная работа!' : 'Попробуйте ещё раз'}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{score}/{questions.length}</p>
              <p className="text-slate-400 text-xs mt-1">Правильных</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-bold ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>{pct}%</p>
              <p className="text-slate-400 text-xs mt-1">Результат</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className={`text-sm font-semibold mt-2 ${passed ? 'text-emerald-300' : 'text-amber-300'}`}>
              {passed ? '✓ Успешно сдан' : '✗ Нужно повторить (порог 70%)'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold">
              <RotateCcw size={16} className="mr-2" /> Пройти снова
            </Button>
            <Button onClick={onBack} variant="outline" className="h-12 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 rounded-xl">
              <ArrowLeft size={16} className="mr-2" /> Вернуться к уроку
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  if (!question) return null

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800">
          <ArrowLeft size={18} />
          <span className="text-sm hidden sm:inline">Назад</span>
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-500">Тестирование</p>
          <p className="text-sm font-semibold">{currentQuestion + 1} / {questions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Счёт</p>
          <p className="text-sm font-bold text-blue-400">{score}</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Question */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            {answered && (
              <div className={`flex items-center gap-2 mb-3 text-sm font-medium ${isCurrentCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isCurrentCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {isCurrentCorrect ? 'Правильно!' : 'Неправильно'}
              </div>
            )}
            <p className="text-white font-semibold text-base sm:text-lg leading-snug">
              {question.question_text}
            </p>
          </div>

          {/* Answers */}
          <div className="space-y-2.5">
            {question.answers.map((answer, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = answered && answer.is_correct
              const isWrong = answered && isSelected && !answer.is_correct

              return (
                <button
                  key={answer.id}
                  onClick={() => !answered && setSelectedAnswer(index)}
                  disabled={answered}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isCorrect
                      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                      : isWrong
                      ? 'border-red-400/60 bg-red-500/10 text-red-200'
                      : isSelected
                      ? 'border-blue-400/60 bg-blue-500/10 text-white'
                      : answered
                      ? 'border-slate-700 bg-slate-900/50 text-slate-400'
                      : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-blue-400/50 hover:bg-slate-800 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                        : isWrong ? 'border-red-400 bg-red-400/20 text-red-300'
                        : isSelected ? 'border-blue-400 bg-blue-400/20 text-blue-300'
                        : 'border-slate-600 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm sm:text-base">{answer.answer_text}</span>
                    </div>
                    {isCorrect && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                    {isWrong && <XCircle size={18} className="text-red-400 shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div className={`rounded-2xl p-4 border text-sm ${isCurrentCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              {isCurrentCorrect ? '✓ Отлично! Вы ответили правильно.' : '✗ Неверно. Правильный ответ выделен зелёным.'}
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-4 border bg-red-500/10 border-red-500/30 text-red-300 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* Bottom action */}
      <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md bottom-nav">
        <div className="max-w-2xl mx-auto">
          {!answered ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || loadingSubmit}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              {loadingSubmit ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Отправка...
                </span>
              ) : 'Ответить'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold"
            >
              {currentQuestion + 1 === questions.length ? 'Завершить тест' : 'Следующий вопрос →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
