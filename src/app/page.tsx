'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useAppRouter } from '@/lib/router'
import { LoginPage } from '@/components/auth/login-page'
import { RegisterPage } from '@/components/auth/register-page'
import { ForgotPasswordPage } from '@/components/auth/forgot-password-page'
import { ResetPasswordPage } from '@/components/auth/reset-password-page'
import { StudentDashboard } from '@/components/student/dashboard'
import { ComparisonWizard } from '@/components/student/comparison-wizard'
import { AnalysisPage } from '@/components/student/analysis-page'
import { SummaryPage } from '@/components/student/summary-page'
import { ProfilePage } from '@/components/student/profile-page'
import { AdminApp } from '@/components/admin/admin-app'
import { Loader2 } from 'lucide-react'

function HomeContent() {
  const { data: session, status } = useSession()
  const { route, navigate } = useAppRouter()

  // Derive a baseline user object directly from the session (no extra render needed)
  const sessionUser = useMemo(() => {
    if (!session?.user) return null
    const u = session.user as any
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      academicLevelId: u.academicLevelId ?? null,
      academicLevelName: u.academicLevelName ?? null,
      isActive: true,
    }
  }, [session])

  // Fetch the full profile asynchronously; only used to enrich (e.g. bio, avatar)
  const [extra, setExtra] = useState<any>(null)
  useEffect(() => {
    if (!sessionUser) return
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((u) => { if (!cancelled && u) setExtra(u) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sessionUser])

  const user = extra ?? sessionUser

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const view = route.view ?? 'home'
  const section = route.section ?? ''
  const id = route.id ?? ''

  // Public auth views (accessible without login)
  if (view === 'login') return <LoginPage onNavigate={navigate} />
  if (view === 'register') return <RegisterPage onNavigate={navigate} />
  if (view === 'forgot-password') return <ForgotPasswordPage onNavigate={navigate} />
  if (view === 'reset-password') return <ResetPasswordPage onNavigate={navigate} />

  // Not authenticated → show login
  if (!session?.user || !user) {
    return <LoginPage onNavigate={navigate} />
  }

  // Admin views — ONLY for users with ADMIN role (server enforces same check on every API)
  if (user.role === 'ADMIN') {
    return <AdminApp user={user} route={route} onNavigate={navigate} />
  }

  // A student trying to access ?view=admin → redirect to their dashboard
  if (view === 'admin') {
    return <StudentDashboard user={user} onNavigate={navigate} />
  }

  // Student views
  if (view === 'student') {
    if (section === 'new-comparison') return <ComparisonWizard user={user} onNavigate={navigate} />
    if (section === 'analysis' && id) return <AnalysisPage user={user} comparisonId={id} onNavigate={navigate} />
    if (section === 'summary' && id) return <SummaryPage user={user} comparisonId={id} onNavigate={navigate} />
    if (section === 'profile') return <ProfilePage user={user} onNavigate={navigate} />
    if (section === 'dashboard' || !section) return <StudentDashboard user={user} onNavigate={navigate} />
  }

  // Default fallback based on role
  if (user.role === 'ADMIN') {
    return <AdminApp user={user} route={{ view: 'admin', section: 'dashboard' }} onNavigate={navigate} />
  }
  return <StudentDashboard user={user} onNavigate={navigate} />
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
