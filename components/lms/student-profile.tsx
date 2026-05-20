'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen, Award, Target, TrendingUp, User } from 'lucide-react'
import { UserState } from '@/types'

interface StudentProfileProps {
  user: UserState
  onBack: () => void
}

interface CourseProgress {
  courseId: number
  courseTitle: string
  lessonsCompleted: number
  totalLessons: number
  testsCompleted: number
  averageScore: number
}

export function StudentProfile({ user, onBack }: StudentProfileProps) {
  const [progress, setProgress] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCourses: 0, totalLessonsCompleted: 0, totalTests: 0, averageScore: 0 })

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}?type=progress`)
      if (res.ok) {
        const data = await res.json()
        setProgress(data.courseProgress || [])
        setStats(data.stats || stats)
      }
    } catch {}
    setLoading(false)
  }

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + (p.totalLessons > 0 ? p.lessonsCompleted / p.totalLessons : 0), 0) / progress.length * 100)
    : 0

  const statCards = [
    { label: 'Курсов', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-300', bg: 'bg-blue-500/20' },
    { label: 'Уроков', value: stats.totalLessonsCompleted, icon: Target, color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
    { label: 'Тестов', value: stats.totalTests, icon: Award, color: 'text-purple-300', bg: 'bg-purple-500/20' },
    { label: 'Средний балл', value: `${Math.round(stats.averageScore)}%`, icon: TrendingUp, color: 'text-orange-300', bg: 'bg-orange-500/20' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0">
        <button onClick={onBack} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs text-slate-500">Профиль</p>
          <p className="text-sm font-semibold leading-tight">{user.name}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Profile card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <User size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{user.name}</h1>
              <p className="text-slate-400 text-sm truncate">{user.email}</p>
              <p className="text-xs text-slate-500 mt-0.5">Студент</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-200">Общий прогресс</p>
              <span className="text-blue-300 font-bold text-lg">{totalProgress}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Course progress */}
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-3">Прогресс по курсам</p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />)}
              </div>
            ) : progress.length > 0 ? (
              <div className="space-y-3">
                {progress.map((course) => {
                  const pct = course.totalLessons > 0 ? Math.round((course.lessonsCompleted / course.totalLessons) * 100) : 0
                  return (
                    <div key={course.courseId} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{course.courseTitle}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {course.lessonsCompleted}/{course.totalLessons} уроков
                            {course.testsCompleted > 0 && ` · ${course.testsCompleted} тестов`}
                          </p>
                        </div>
                        <span className="text-blue-300 font-bold text-lg shrink-0">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {course.testsCompleted > 0 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                          <p className="text-slate-400 text-xs">Средний результат тестов</p>
                          <p className="text-white text-sm font-semibold">{Math.round(course.averageScore)}%</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                <BookOpen size={32} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">Прогресс появится после прохождения уроков</p>
              </div>
            )}
          </div>

          <Button onClick={onBack} variant="outline" className="w-full h-12 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 rounded-xl">
            <ArrowLeft size={16} className="mr-2" /> Вернуться
          </Button>
        </div>
      </div>
    </div>
  )
}
