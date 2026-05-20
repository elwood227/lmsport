'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, BookOpen, FlaskConical, TrendingUp, User, LogOut, Menu, X, Play, CheckCircle } from 'lucide-react'
import { Course, Lesson, UserState } from '@/types'

interface ReadingViewProps {
  onLogout: () => void
  user: UserState
  onStartTesting: (lessonId: number) => void
  onOpenProfile: () => void
}

type Tab = 'courses' | 'tests' | 'progress'

interface StandaloneTest {
  id: number
  title: string
  lesson_id: number
  question_count: number
}

export function ReadingView({ onLogout, user, onStartTesting, onOpenProfile }: ReadingViewProps) {
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizAvailable, setQuizAvailable] = useState(false)
  const [standaloneTests, setStandaloneTests] = useState<StandaloneTest[]>([])
  const [loadingTests, setLoadingTests] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<number[]>([])
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId) ?? null, [courses, selectedCourseId])
  const selectedLesson = useMemo(() => lessons.find((l) => l.id === selectedLessonId) ?? null, [lessons, selectedLessonId])
  const currentLessonIndex = selectedLesson ? lessons.findIndex((l) => l.id === selectedLesson.id) : -1

  useEffect(() => { loadCourses() }, [])

  useEffect(() => {
    if (tab === 'tests') loadStandaloneTests()
    if (tab === 'progress' && selectedCourseId) loadProgress(selectedCourseId)
  }, [tab])

  useEffect(() => {
    if (selectedCourseId !== null) loadLessons(selectedCourseId)
  }, [selectedCourseId])

  useEffect(() => {
    if (selectedLessonId !== null) checkQuizAvailability(selectedLessonId)
    else setQuizAvailable(false)
  }, [selectedLessonId])

  async function loadCourses() {
    setLoadingCourses(true)
    setError('')
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCourses(data)
      if (data.length > 0 && selectedCourseId === null) setSelectedCourseId(data[0].id)
    } catch {
      setError('Не удалось загрузить курсы.')
    }
    setLoadingCourses(false)
  }

  async function loadLessons(courseId: number) {
    setLoadingLessons(true)
    setLessons([])
    setSelectedLessonId(null)
    try {
      const res = await fetch(`/api/lessons?courseId=${courseId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLessons(data)
      if (data.length > 0) setSelectedLessonId(data[0].id)
    } catch {
      setError('Не удалось загрузить уроки.')
    }
    setLoadingLessons(false)
  }

  async function checkQuizAvailability(lessonId: number) {
    setLoadingQuiz(true)
    setQuizAvailable(false)
    try {
      const res = await fetch(`/api/quiz?lessonId=${lessonId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuizAvailable(Array.isArray(data) && data.length > 0)
    } catch {
      setQuizAvailable(false)
    }
    setLoadingQuiz(false)
  }

  async function loadStandaloneTests() {
    setLoadingTests(true)
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error()
      const allCourses: Course[] = await res.json()
      const allLessons = await Promise.all(
        allCourses.map((c) =>
          fetch(`/api/lessons?courseId=${c.id}`)
            .then((r) => r.json())
            .then((ls: Lesson[]) => ls.map((l) => ({ ...l, courseTitle: c.title })))
        )
      )
      const flat = allLessons.flat()
      const withQuiz = await Promise.all(
        flat.map(async (l: any) => {
          const r = await fetch(`/api/quiz?lessonId=${l.id}`)
          const q = await r.json()
          return Array.isArray(q) && q.length > 0
            ? { id: l.id, title: `${l.courseTitle} — ${l.title}`, lesson_id: l.id, question_count: q.length }
            : null
        })
      )
      setStandaloneTests(withQuiz.filter(Boolean) as StandaloneTest[])
    } catch {
      setStandaloneTests([])
    }
    setLoadingTests(false)
  }

  async function loadProgress(courseId: number) {
    if (!user.id) return
    try {
      const res = await fetch(`/api/progress?userId=${user.id}&courseId=${courseId}`)
      if (!res.ok) return
      const data = await res.json()
      setCompletedLessons(data.completedLessons || [])
    } catch {}
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'tests', label: 'Тесты', icon: FlaskConical },
    { id: 'progress', label: 'Прогресс', icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            aria-label="Открыть меню"
          >
            <Menu size={20} />
          </button>
          <img src="/logo1.jpg" alt="ЭОП" className="h-8 w-8 rounded-xl object-cover" />
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 leading-none">ЭОП</p>
            <p className="text-sm font-semibold leading-tight truncate max-w-[160px]">
              {selectedCourse?.title ?? 'Учебные программы'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <User size={18} />
            <span className="hidden sm:block text-sm font-medium">{user.name}</span>
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            aria-label="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-slate-800 bg-slate-900/50 flex-col overflow-hidden">
          <SidebarContent
            tab={tab}
            setTab={setTab}
            tabs={tabs}
            courses={courses}
            lessons={lessons}
            selectedCourseId={selectedCourseId}
            selectedLessonId={selectedLessonId}
            setSelectedCourseId={setSelectedCourseId}
            setSelectedLessonId={setSelectedLessonId}
            loadingCourses={loadingCourses}
            loadingLessons={loadingLessons}
            loadingTests={loadingTests}
            standaloneTests={standaloneTests}
            completedLessons={completedLessons}
            onStartTesting={onStartTesting}
          />
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <img src="/logo1.jpg" alt="ЭОП" className="h-8 w-8 rounded-xl" />
                  <span className="font-semibold">Меню</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-100">
                  <X size={20} />
                </button>
              </div>
              <SidebarContent
                tab={tab}
                setTab={(t: Tab) => { setTab(t); setSidebarOpen(false) }}
                tabs={tabs}
                courses={courses}
                lessons={lessons}
                selectedCourseId={selectedCourseId}
                selectedLessonId={selectedLessonId}
                setSelectedCourseId={(id: number) => { setSelectedCourseId(id); setSidebarOpen(false) }}
                setSelectedLessonId={(id: number) => { setSelectedLessonId(id); setSidebarOpen(false) }}
                loadingCourses={loadingCourses}
                loadingLessons={loadingLessons}
                loadingTests={loadingTests}
                standaloneTests={standaloneTests}
                completedLessons={completedLessons}
                onStartTesting={(id: number) => { onStartTesting(id); setSidebarOpen(false) }}
              />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 pb-24 lg:pb-6 max-w-4xl mx-auto">
            {tab === 'tests' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Тесты</h2>
                {loadingTests ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />)}
                  </div>
                ) : standaloneTests.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {standaloneTests.map((t) => (
                      <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                        <p className="font-semibold text-white mb-1 leading-snug">{t.title}</p>
                        <p className="text-sm text-slate-400 mb-4">{t.question_count} вопросов</p>
                        <Button onClick={() => onStartTesting(t.lesson_id)} className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                          <Play size={16} className="mr-2" /> Начать тест
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                    Нет доступных тестов.
                  </div>
                )}
              </div>
            )}

            {tab === 'progress' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Мой прогресс</h2>
                <div className="space-y-3">
                  {courses.map((course) => {
                    const pct = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0
                    return (
                      <div key={course.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{course.title}</h3>
                          <span className="text-blue-300 font-bold text-sm">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${pct}%` }} />
                        </div>
                        <button
                          onClick={() => { setSelectedCourseId(course.id); setTab('courses') }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Перейти к курсу →
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tab === 'courses' && (
              <>
                {error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300">{error}</div>
                ) : !selectedCourse ? (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                    <BookOpen size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-lg font-semibold mb-1">Добро пожаловать!</p>
                    <p className="text-slate-400 text-sm">Выберите курс в меню для начала обучения.</p>
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium">
                      Открыть меню
                    </button>
                  </div>
                ) : !selectedLesson ? (
                  loadingLessons ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-800/50 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      В этом курсе пока нет уроков.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* Lesson header */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{selectedCourse.title}</p>
                          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{selectedLesson.title}</h2>
                        </div>
                        <span className="shrink-0 text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
                          {currentLessonIndex + 1}/{lessons.length}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-4">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${((currentLessonIndex + 1) / lessons.length) * 100}%` }}
                        />
                      </div>

                      {/* Lesson content */}
                      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 mb-4">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedLesson.content ?? 'Контент пока не добавлен.'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => { if (currentLessonIndex > 0) setSelectedLessonId(lessons[currentLessonIndex - 1].id) }}
                          disabled={currentLessonIndex <= 0}
                          variant="outline"
                          className="h-11 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 rounded-xl"
                        >
                          <ChevronLeft size={16} />
                          <span className="hidden sm:inline ml-1">Назад</span>
                        </Button>
                        <Button
                          onClick={() => onStartTesting(selectedLesson.id)}
                          disabled={!quizAvailable || loadingQuiz}
                          className="h-11 flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold"
                        >
                          {loadingQuiz ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Проверка...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Play size={16} />
                              {quizAvailable ? 'Начать тест' : 'Нет теста'}
                            </span>
                          )}
                        </Button>
                        <Button
                          onClick={() => { if (currentLessonIndex + 1 < lessons.length) setSelectedLessonId(lessons[currentLessonIndex + 1].id) }}
                          disabled={currentLessonIndex + 1 >= lessons.length}
                          variant="outline"
                          className="h-11 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 rounded-xl"
                        >
                          <span className="hidden sm:inline mr-1">Вперёд</span>
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Lesson list */}
                    {lessons.length > 1 && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Все уроки</p>
                        <div className="space-y-1">
                          {lessons.map((lesson, idx) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                                lesson.id === selectedLessonId
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                lesson.id === selectedLessonId ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {completedLessons.includes(lesson.id) ? <CheckCircle size={12} /> : idx + 1}
                              </span>
                              <span className="truncate">{lesson.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 bottom-nav">
        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                tab === t.id ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
          <button
            onClick={onOpenProfile}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-slate-500"
          >
            <User size={20} />
            Профиль
          </button>
        </div>
      </nav>
    </div>
  )
}

// Extracted sidebar content component
function SidebarContent({
  tab, setTab, tabs, courses, lessons, selectedCourseId, selectedLessonId,
  setSelectedCourseId, setSelectedLessonId, loadingCourses, loadingLessons,
  loadingTests, standaloneTests, completedLessons, onStartTesting,
}: any) {
  return (
    <>
      {/* Tab switcher */}
      <div className="flex border-b border-slate-800 shrink-0">
        {tabs.map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition ${
              tab === t.id ? 'text-blue-300 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {tab === 'courses' && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-widest px-1 pt-1 pb-2">Курсы</p>
            {loadingCourses ? (
              <div className="space-y-2 px-1">
                {[1, 2, 3].map(i => <div key={i} className="h-9 rounded-xl bg-slate-800/50 animate-pulse" />)}
              </div>
            ) : courses.length > 0 ? (
              courses.map((course: Course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${
                    course.id === selectedCourseId
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {course.title}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500 px-1">Нет курсов.</p>
            )}

            {selectedCourseId && (
              <>
                <p className="text-xs text-slate-500 uppercase tracking-widest px-1 pt-3 pb-2">Уроки</p>
                {loadingLessons ? (
                  <div className="space-y-2 px-1">
                    {[1, 2].map(i => <div key={i} className="h-9 rounded-xl bg-slate-800/50 animate-pulse" />)}
                  </div>
                ) : lessons.length > 0 ? (
                  lessons.map((lesson: Lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${
                        lesson.id === selectedLessonId
                          ? 'bg-slate-800 border border-blue-500/40 text-blue-200'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      {lesson.title}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 px-1">Нет уроков.</p>
                )}
              </>
            )}
          </>
        )}

        {tab === 'tests' && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-widest px-1 pt-1 pb-2">Все тесты</p>
            {loadingTests ? (
              <div className="space-y-2 px-1">
                {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}
              </div>
            ) : standaloneTests.length > 0 ? (
              standaloneTests.map((t: StandaloneTest) => (
                <button
                  key={t.id}
                  onClick={() => onStartTesting(t.lesson_id)}
                  className="w-full text-left rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition"
                >
                  <p className="font-medium leading-snug">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.question_count} вопросов</p>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500 px-1">Нет доступных тестов.</p>
            )}
          </>
        )}

        {tab === 'progress' && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-widest px-1 pt-1 pb-2">Прогресс</p>
            {courses.map((course: Course) => {
              const courseLessons = lessons.filter((l: Lesson) => l.course_id === course.id)
              const done = completedLessons.filter((id: number) => courseLessons.some((l: Lesson) => l.id === id)).length
              const total = courseLessons.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div key={course.id} className="rounded-xl bg-slate-800/50 px-3 py-2.5">
                  <p className="text-sm text-slate-200 font-medium">{course.title}</p>
                  <p className="text-xs text-slate-500 mb-1.5">{done}/{total} уроков</p>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
