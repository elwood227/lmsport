'use client'

import { useEffect, useState } from 'react'
import { AuthView } from './auth-view'
import { AdminView } from './admin-view'
import { ReadingView } from './reading-view'
import { TestingView } from './testing-view'
import { StudentProfile } from './student-profile'
import { UserState } from '@/types'

type ViewType = 'auth' | 'admin' | 'reading' | 'testing' | 'profile'

export function LMSApp() {
  const [currentView, setCurrentView] = useState<ViewType>('auth')
  const [user, setUser] = useState<UserState>({
    isAuthenticated: false,
    userType: null,
    name: null,
    id: null,
    email: null,
  })
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setInitialized(true)
      return
    }

    try {
      const stored = window.localStorage.getItem('lmsSession')
      if (stored) {
        const session = JSON.parse(stored)
        if (session?.isAuthenticated && session?.id) {
          setUser({
            isAuthenticated: true,
            userType: session.userType,
            name: session.name,
            id: session.id,
            email: session.email,
          })
          setCurrentView(session.currentView || (session.userType === 'teacher' ? 'admin' : 'reading'))
          setSelectedLessonId(session.selectedLessonId ?? null)
        }
      }
    } catch (error) {
      console.error('Failed to restore session', error)
    }

    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) {
      return
    }

    if (user.isAuthenticated) {
      window.localStorage.setItem(
        'lmsSession',
        JSON.stringify({
          ...user,
          currentView,
          selectedLessonId,
        })
      )
    } else {
      window.localStorage.removeItem('lmsSession')
    }
  }, [user, currentView, selectedLessonId, initialized])

  const handleLogin = (userData: {
    id: number
    name: string
    userType: 'teacher' | 'student'
    email: string
  }) => {
    setUser({
      isAuthenticated: true,
      userType: userData.userType,
      name: userData.name,
      id: userData.id,
      email: userData.email,
    })
    setSelectedLessonId(null)

    if (userData.userType === 'teacher') {
      setCurrentView('admin')
    } else {
      setCurrentView('reading')
    }
  }

  const handleLogout = () => {
    setUser({
      isAuthenticated: false,
      userType: null,
      name: null,
      id: null,
      email: null,
    })
    setSelectedLessonId(null)
    setCurrentView('auth')
  }

  const handleStartTesting = (lessonId: number) => {
    setSelectedLessonId(lessonId)
    setCurrentView('testing')
  }

  const handleBackToReading = () => {
    setCurrentView('reading')
  }

  const handleOpenProfile = () => {
    setCurrentView('profile')
  }

  const handleBackToView = () => {
    setCurrentView(user.userType === 'teacher' ? 'admin' : 'reading')
  }

  const renderView = () => {
    if (!user.isAuthenticated) {
      return <AuthView onLogin={handleLogin} />
    }

    switch (currentView) {
      case 'admin':
        return <AdminView onLogout={handleLogout} user={user} />
      case 'reading':
        return <ReadingView onLogout={handleLogout} user={user} onStartTesting={handleStartTesting} onOpenProfile={handleOpenProfile} />
      case 'testing':
        return (
          <TestingView
            onLogout={handleLogout}
            user={user}
            lessonId={selectedLessonId}
            onBack={handleBackToReading}
          />
        )
      case 'profile':
        return <StudentProfile user={user} onBack={handleBackToView} />
      default:
        return user.userType === 'teacher' ? (
          <AdminView onLogout={handleLogout} user={user} />
        ) : (
          <ReadingView onLogout={handleLogout} user={user} onStartTesting={handleStartTesting} onOpenProfile={handleOpenProfile} />
        )
    }
  }

  return <>{renderView()}</>
}
