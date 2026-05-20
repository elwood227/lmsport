'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BookOpen, Plus, Home, FileText, LogOut, User, Upload, Download,
  Pencil, Trash2, X, Check, Menu, Users, ChevronDown, ChevronUp,
} from 'lucide-react'
import { UserState } from '@/types'

interface AdminViewProps { onLogout: () => void; user: UserState }
interface Course { id: number; title: string; description: string; teacher_id: number }
interface Lesson { id: number; course_id: number; title: string; content: string; order_index: number }
interface QuizQ { id: number; lesson_id: number; question_text: string; answers: { id: number; answer_text: string; is_correct: boolean }[] }

const inputCls = 'h-11 bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl'
const cardCls = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4'

export function AdminView({ onLogout, user }: AdminViewProps) {
  const [activeNav, setActiveNav] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQ[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)

  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonOrder, setLessonOrder] = useState(1)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  const [qText, setQText] = useState('')
  const [qAnswers, setQAnswers] = useState(['', '', '', ''])
  const [qCorrect, setQCorrect] = useState(0)
  const [editingQ, setEditingQ] = useState<QuizQ | null>(null)

  const [uName, setUName] = useState('')
  const [uEmail, setUEmail] = useState('')
  const [uPassword, setUPassword] = useState('')
  const [uType, setUType] = useState<'student' | 'teacher'>('student')
  const [editingUser, setEditingUser] = useState<any | null>(null)

  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (['home', 'courses', 'lessons', 'quiz'].includes(activeNav)) loadCourses()
    if (activeNav === 'users') loadUsers()
  }, [activeNav])

  useEffect(() => { if (selectedCourseId) loadLessons(selectedCourseId) }, [selectedCourseId])
  useEffect(() => { if (selectedLessonId) loadQuiz(selectedLessonId) }, [selectedLessonId])

  async function loadCourses() {
    setLoading(true)
    try {
      const data = await fetch('/api/courses').then(r => r.json())
      const mine = data.filter((c: Course) => c.teacher_id === user.id)
      setCourses(mine)
      if (mine.length > 0 && !selectedCourseId) setSelectedCourseId(mine[0].id)
    } catch {}
    setLoading(false)
  }

  async function loadLessons(courseId: number) {
    try {
      const data = await fetch(`/api/lessons?courseId=${courseId}`).then(r => r.json())
      setLessons(data)
      if (data.length > 0 && !selectedLessonId) setSelectedLessonId(data[0].id)
    } catch {}
  }

  async function loadQuiz(lessonId: number) {
    try {
      const data = await fetch(`/api/quiz?lessonId=${lessonId}`).then(r => r.json())
      setQuizQuestions(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await fetch('/api/users').then(r => r.json())
      setUsers(data.users || [])
    } catch {}
    setLoading(false)
  }

  async function saveCourse() {
    if (!courseTitle.trim()) return
    setSaving(true)
    try {
      if (editingCourse) {
        const res = await fetch('/api/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCourse.id, title: courseTitle, description: courseDesc }) })
        const updated = await res.json()
        setCourses(courses.map(c => c.id === updated.id ? updated : c))
      } else {
        const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: courseTitle, description: courseDesc, teacherId: user.id }) })
        const created = await res.json()
        setCourses([created, ...courses])
        setSelectedCourseId(created.id)
      }
      setCourseTitle(''); setCourseDesc(''); setEditingCourse(null)
    } catch {}
    setSaving(false)
  }

  async function deleteCourse(id: number) {
    if (!confirm('Удалить курс и все его уроки?')) return
    await fetch('/api/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCourses(courses.filter(c => c.id !== id))
    if (selectedCourseId === id) { setSelectedCourseId(null); setLessons([]) }
  }

  async function saveLesson() {
    if (!lessonTitle.trim() || !selectedCourseId) return
    setSaving(true)
    try {
      if (editingLesson) {
        const res = await fetch('/api/lessons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingLesson.id, title: lessonTitle, content: lessonContent, orderIndex: lessonOrder }) })
        const updated = await res.json()
        setLessons(lessons.map(l => l.id === updated.id ? updated : l))
      } else {
        const res = await fetch('/api/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: selectedCourseId, title: lessonTitle, content: lessonContent, orderIndex: lessonOrder }) })
        const created = await res.json()
        setLessons([...lessons, created])
        setSelectedLessonId(created.id)
      }
      setLessonTitle(''); setLessonContent(''); setLessonOrder(1); setEditingLesson(null)
    } catch {}
    setSaving(false)
  }

  async function deleteLesson(id: number) {
    if (!confirm('Удалить урок и все его тесты?')) return
    await fetch('/api/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setLessons(lessons.filter(l => l.id !== id))
    if (selectedLessonId === id) { setSelectedLessonId(null); setQuizQuestions([]) }
  }

  async function saveQuestion() {
    if (!qText.trim() || qAnswers.some(a => !a.trim()) || !selectedLessonId) return
    setSaving(true)
    const answersPayload = qAnswers.map((text, i) => ({ text, isCorrect: i === qCorrect }))
    try {
      if (editingQ) {
        await fetch('/api/quiz', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingQ.id, questionText: qText, answers: answersPayload }) })
        await loadQuiz(selectedLessonId)
      } else {
        await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: selectedLessonId, questionText: qText, answers: answersPayload }) })
        await loadQuiz(selectedLessonId)
      }
      setQText(''); setQAnswers(['', '', '', '']); setQCorrect(0); setEditingQ(null)
    } catch {}
    setSaving(false)
  }

  async function deleteQuestion(id: number) {
    if (!confirm('Удалить вопрос?')) return
    await fetch('/api/quiz', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuizQuestions(quizQuestions.filter(q => q.id !== id))
  }

  async function saveUser() {
    if (!uName.trim() || !uEmail.trim()) return
    setSaving(true)
    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: uName, email: uEmail, userType: uType }) })
        const updated = await res.json()
        setUsers(users.map(u => u.id === updated.id ? { ...u, ...updated } : u))
      } else {
        if (!uPassword.trim()) { setSaving(false); return }
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: uName, email: uEmail, password: uPassword, userType: uType }) })
        const created = await res.json()
        if (!created.error) setUsers([created, ...users])
      }
      setUName(''); setUEmail(''); setUPassword(''); setUType('student'); setEditingUser(null)
    } catch {}
    setSaving(false)
  }

  async function deleteUser(id: number) {
    if (!confirm('Удалить пользователя?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers(users.filter(u => u.id !== id))
  }

  const navItems = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'lessons', label: 'Уроки', icon: FileText },
    { id: 'quiz', label: 'Тесты', icon: Plus },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'import', label: 'Импорт JSON', icon: Upload },
  ]

  const navigate = (id: string) => { setActiveNav(id); setSidebarOpen(false) }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800" aria-label="Меню">
            <Menu size={20} />
          </button>
          <img src="/logo1.jpg" alt="ЭОП" className="h-8 w-8 rounded-xl object-cover" />
          <div>
            <p className="text-xs text-slate-500 leading-none hidden sm:block">Панель администратора</p>
            <p className="text-sm font-semibold leading-tight">ЭОП Админ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-slate-400">{user.name}</span>
          <button onClick={onLogout} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10" aria-label="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-56 border-r border-slate-800 bg-slate-900/50 flex-col p-3 gap-1">
          <nav className="flex-1 space-y-0.5">
            {navItems.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${activeNav === item.id ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
                <item.icon size={16} />{item.label}
              </button>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 px-2 pb-1">{user.name}</div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col p-3 gap-1">
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <span className="font-semibold text-slate-100">Меню</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-100"><X size={20} /></button>
              </div>
              {navItems.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition ${activeNav === item.id ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
                  <item.icon size={16} />{item.label}
                </button>
              ))}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-5">

            {/* HOME */}
            {activeNav === 'home' && (
              <div className="space-y-5">
                <div className={cardCls}>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Разработок электронных учебных программ</p>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Панель администратора</h1>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Курсов', courses.length, 'text-blue-300'], ['Уроков', lessons.length, 'text-purple-300'], ['Пользователей', users.length, 'text-emerald-300']].map(([label, val, color]) => (
                    <div key={label as string} className={cardCls}>
                      <p className="text-slate-400 text-xs mb-1">{label}</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {navItems.slice(1).map(item => (
                    <button key={item.id} onClick={() => navigate(item.id)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm transition">
                      <item.icon size={16} className="text-blue-400" />{item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COURSES */}
            {activeNav === 'courses' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">{editingCourse ? 'Редактировать курс' : 'Новый курс'}</h2>
                <div className={`${cardCls} space-y-3`}>
                  <Input placeholder="Название курса" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className={inputCls} />
                  <Textarea placeholder="Описание" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} rows={3} className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl w-full" />
                  <div className="flex gap-2">
                    <Button onClick={saveCourse} disabled={saving} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                      {saving ? 'Сохранение...' : editingCourse ? 'Сохранить' : 'Создать курс'}
                    </Button>
                    {editingCourse && (
                      <Button variant="outline" onClick={() => { setEditingCourse(null); setCourseTitle(''); setCourseDesc('') }} className="h-11 bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {loading ? <p className="text-slate-500 text-sm">Загрузка...</p> : courses.map(c => (
                    <div key={c.id} className={`${cardCls} flex items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{c.title}</p>
                        <p className="text-slate-400 text-sm truncate">{c.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingCourse(c); setCourseTitle(c.title); setCourseDesc(c.description || '') }} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300"><Pencil size={14} /></button>
                        <button onClick={() => deleteCourse(c.id)} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LESSONS */}
            {activeNav === 'lessons' && (
              <div className="space-y-4">
                <div className={cardCls}>
                  <Label className="text-slate-400 text-xs mb-1.5 block">Курс</Label>
                  <select value={selectedCourseId ?? ''} onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedLessonId(null) }}
                    className="w-full h-11 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 text-sm">
                    <option value="">Выберите курс</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <h2 className="text-lg font-bold">{editingLesson ? 'Редактировать урок' : 'Новый урок'}</h2>
                <div className={`${cardCls} space-y-3`}>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <Input placeholder="Название урока" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className={inputCls} />
                    <Input type="number" min={1} placeholder="№" value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} className={inputCls} />
                  </div>
                  <Textarea placeholder="Содержание урока" value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={5} className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl w-full" />
                  <div className="flex gap-2">
                    <Button onClick={saveLesson} disabled={saving || !selectedCourseId} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                      {saving ? 'Сохранение...' : editingLesson ? 'Сохранить' : 'Создать урок'}
                    </Button>
                    {editingLesson && (
                      <Button variant="outline" onClick={() => { setEditingLesson(null); setLessonTitle(''); setLessonContent(''); setLessonOrder(1) }} className="h-11 bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {lessons.map(l => (
                    <div key={l.id} className={`${cardCls} flex items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{l.order_index}. {l.title}</p>
                        <p className="text-slate-400 text-sm line-clamp-1">{l.content}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingLesson(l); setLessonTitle(l.title); setLessonContent(l.content || ''); setLessonOrder(l.order_index) }} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300"><Pencil size={14} /></button>
                        <button onClick={() => deleteLesson(l.id)} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUIZ */}
            {activeNav === 'quiz' && (
              <div className="space-y-4">
                <div className={`${cardCls} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Курс</Label>
                    <select value={selectedCourseId ?? ''} onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedLessonId(null) }}
                      className="w-full h-11 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 text-sm">
                      <option value="">Выберите курс</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Урок</Label>
                    <select value={selectedLessonId ?? ''} onChange={e => setSelectedLessonId(Number(e.target.value))}
                      className="w-full h-11 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 text-sm">
                      <option value="">Выберите урок</option>
                      {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                  </div>
                </div>
                <h2 className="text-lg font-bold">{editingQ ? 'Редактировать вопрос' : 'Новый вопрос'}</h2>
                <div className={`${cardCls} space-y-3`}>
                  <Input placeholder="Текст вопроса" value={qText} onChange={e => setQText(e.target.value)} className={inputCls} />
                  <div className="space-y-2">
                    {qAnswers.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button onClick={() => setQCorrect(i)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${qCorrect === i ? 'border-blue-400 bg-blue-400/20' : 'border-slate-600 hover:border-slate-400'}`}>
                          {qCorrect === i && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />}
                        </button>
                        <Input placeholder={`Вариант ${i + 1}`} value={a} onChange={e => { const n = [...qAnswers]; n[i] = e.target.value; setQAnswers(n) }} className={inputCls} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Нажмите на кружок слева чтобы выбрать правильный ответ</p>
                  <div className="flex gap-2">
                    <Button onClick={saveQuestion} disabled={saving || !selectedLessonId} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                      {saving ? 'Сохранение...' : editingQ ? 'Сохранить' : 'Добавить вопрос'}
                    </Button>
                    {editingQ && (
                      <Button variant="outline" onClick={() => { setEditingQ(null); setQText(''); setQAnswers(['', '', '', '']); setQCorrect(0) }} className="h-11 bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {quizQuestions.map((q, qi) => (
                    <div key={q.id} className={cardCls}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 mb-2">{qi + 1}. {q.question_text}</p>
                          <div className="space-y-1">
                            {q.answers.map(a => (
                              <div key={a.id} className={`flex items-center gap-2 text-sm ${a.is_correct ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {a.is_correct ? <Check size={12} className="shrink-0" /> : <span className="w-3 shrink-0" />}
                                <span className="truncate">{a.answer_text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditingQ(q); setQText(q.question_text); setQAnswers(q.answers.map(a => a.answer_text).concat(['', '', '', '']).slice(0, 4)); setQCorrect(q.answers.findIndex(a => a.is_correct)) }} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300"><Pencil size={14} /></button>
                          <button onClick={() => deleteQuestion(q.id)} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {activeNav === 'users' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>
                <div className={`${cardCls} space-y-3`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="Имя" value={uName} onChange={e => setUName(e.target.value)} className={inputCls} />
                    <Input placeholder="Email" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} className={inputCls} />
                    {!editingUser && <Input placeholder="Пароль" type="password" value={uPassword} onChange={e => setUPassword(e.target.value)} className={inputCls} />}
                    <select value={uType} onChange={e => setUType(e.target.value as any)}
                      className="h-11 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-xl px-3 text-sm">
                      <option value="student">Студент</option>
                      <option value="teacher">Учитель</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveUser} disabled={saving} className="h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                      {saving ? 'Сохранение...' : editingUser ? 'Сохранить' : 'Создать'}
                    </Button>
                    {editingUser && (
                      <Button variant="outline" onClick={() => { setEditingUser(null); setUName(''); setUEmail(''); setUPassword(''); setUType('student') }} className="h-11 bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {loading ? <p className="text-slate-500 text-sm">Загрузка...</p> : users.map(u => (
                    <div key={u.id} className={`${cardCls} flex items-center justify-between gap-3`}>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{u.name}</p>
                        <p className="text-slate-400 text-sm truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.userType === 'teacher' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {u.userType === 'teacher' ? 'Учитель' : 'Студент'}
                        </span>
                        <button onClick={() => { setEditingUser(u); setUName(u.name); setUEmail(u.email); setUType(u.userType) }} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300"><Pencil size={14} /></button>
                        {u.id !== user.id && <button onClick={() => deleteUser(u.id)} className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IMPORT */}
            {activeNav === 'import' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Импорт курса из JSON</h2>
                <div className={`${cardCls} space-y-3`}>
                  <p className="text-slate-300 text-sm font-semibold">Скачать образцы</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Минимальный', filename: 'sample-minimal.json', data: { title: 'Название курса', description: 'Краткое описание', lessons: [{ title: 'Урок 1', content: 'Текст урока.', order_index: 1, questions: [{ text: 'Вопрос?', answers: [{ text: 'Правильный', correct: true }, { text: 'Неправильный', correct: false }] }] }] } },
                      { label: 'Полный (3 урока)', filename: 'sample-full.json', data: { title: 'Основы программирования', description: 'Вводный курс', lessons: [{ title: 'Введение', content: 'Программирование — написание инструкций для компьютера.', order_index: 1, questions: [{ text: 'Что такое программирование?', answers: [{ text: 'Написание инструкций для компьютера', correct: true }, { text: 'Ремонт компьютеров', correct: false }] }] }, { title: 'Переменные', content: 'Переменная — именованная область памяти.', order_index: 2, questions: [] }, { title: 'Условия', content: 'Оператор if выполняет код при условии.', order_index: 3, questions: [] }] } },
                    ].map(({ label, filename, data }) => (
                      <Button key={filename} onClick={() => {
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
                        a.download = filename; a.click()
                      }} className="h-10 flex gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl">
                        <Download size={14} />{label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className={`${cardCls} space-y-3`}>
                  <p className="text-slate-300 text-sm font-semibold">Загрузить файл</p>
                  <input type="file" accept=".json"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const r = new FileReader()
                      r.onload = ev => {
                        const text = ev.target?.result as string
                        try { JSON.parse(text); setImportJson(text); setImportResult(null) }
                        catch { setImportResult('❌ Файл содержит невалидный JSON') }
                      }
                      r.readAsText(f)
                    }}
                    className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600 cursor-pointer" />
                  {importJson && (() => {
                    try {
                      const parsed = JSON.parse(importJson)
                      return (
                        <div className="rounded-xl bg-slate-950/50 border border-slate-700 p-3 text-sm text-slate-400 space-y-1">
                          <p>📚 <span className="text-slate-200">{parsed.title}</span></p>
                          <p>📖 Уроков: <span className="text-slate-200">{parsed.lessons?.length ?? 0}</span></p>
                          <p>❓ Вопросов: <span className="text-slate-200">{parsed.lessons?.reduce((s: number, l: any) => s + (l.questions?.length ?? 0), 0) ?? 0}</span></p>
                        </div>
                      )
                    } catch { return null }
                  })()}
                  <Button disabled={!importJson || importing} onClick={async () => {
                    setImporting(true); setImportResult(null)
                    try {
                      const course = JSON.parse(importJson)
                      if (!course.title) { setImportResult('❌ Поле "title" обязательно'); setImporting(false); return }
                      const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course, teacherId: user.id }) })
                      const data = await res.json()
                      setImportResult(res.ok ? `✅ Импорт успешен! Курс: "${course.title}", уроков: ${data.lessons}, вопросов: ${data.questions}` : `❌ Ошибка: ${data.error}`)
                      if (res.ok) { setImportJson(''); loadCourses() }
                    } catch { setImportResult('❌ Неверный формат JSON') }
                    setImporting(false)
                  }} className="h-11 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                    {importing ? 'Импортируется...' : 'Импортировать курс'}
                  </Button>
                  {importResult && (
                    <div className={`rounded-xl p-3 text-sm ${importResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                      {importResult}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 bottom-nav">
        <div className="flex overflow-x-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`flex-1 min-w-[56px] flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${activeNav === item.id ? 'text-blue-400' : 'text-slate-500'}`}>
              <item.icon size={18} />
              <span className="truncate w-full text-center px-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
