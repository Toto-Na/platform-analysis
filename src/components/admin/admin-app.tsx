'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, Globe, FileText, Eye,
  HelpCircle, FolderTree, BarChart3, Settings, History, LogOut,
  Menu, X, ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { Header } from '@/components/shared/header'
import { AdminDashboard } from './admin-dashboard'
import { AdminStudents } from './admin-students'
import { AdminLevels } from './admin-levels'
import { AdminWebsites } from './admin-websites'
import { AdminComparisons } from './admin-comparisons'
import { AdminReview } from './admin-review'
import { AdminQuestions } from './admin-questions'
import { AdminCategories } from './admin-categories'
import { AdminReports } from './admin-reports'
import { AdminSettings } from './admin-settings'
import { AdminAuditLogs } from './admin-audit-logs'

const NAV = [
  { section: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, component: AdminDashboard },
  { section: 'students', label: 'إدارة الطلاب', icon: Users, component: AdminStudents },
  { section: 'levels', label: 'المستويات الدراسية', icon: GraduationCap, component: AdminLevels },
  { section: 'websites', label: 'إدارة المواقع', icon: Globe, component: AdminWebsites },
  { section: 'comparisons', label: 'إدارة المقارنات', icon: FileText, component: AdminComparisons },
  { section: 'review', label: 'مراجعة التحليلات', icon: Eye, component: AdminReview },
  { section: 'questions', label: 'إدارة الأسئلة', icon: HelpCircle, component: AdminQuestions },
  { section: 'categories', label: 'أقسام الأسئلة', icon: FolderTree, component: AdminCategories },
  { section: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3, component: AdminReports },
  { section: 'settings', label: 'إعدادات النظام', icon: Settings, component: AdminSettings },
  { section: 'audit-logs', label: 'سجل العمليات', icon: History, component: AdminAuditLogs },
]

export function AdminApp({ user, route, onNavigate }: { user: any; route: any; onNavigate: (p: Record<string, string>) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const section = route.section ?? 'dashboard'
  const id = route.id ?? ''
  const active = NAV.find((n) => n.section === section) ?? NAV[0]
  const Component = active.component

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <aside
          className={cn(
            'fixed lg:static inset-y-0 right-0 z-40 w-64 bg-background border-l border-border transform transition-transform lg:transform-none',
            mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          )}
          style={{ top: '4rem' }}
        >
          <div className="h-full overflow-y-auto scrollbar-thin p-3">
            <nav className="space-y-1">
              {NAV.map((n) => {
                const isActive = n.section === section
                return (
                  <button
                    key={n.section}
                    onClick={() => {
                      onNavigate({ view: 'admin', section: n.section })
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{n.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => signOut({ redirect: false }).then(() => onNavigate({ view: 'login' }))}
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {/* Mobile menu button */}
          <div className="lg:hidden mb-4">
            <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4 ml-2" /> القائمة
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <span>لوحة الإدارة</span>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-foreground font-medium">{active.label}</span>
          </div>

          <Component user={user} route={route} onNavigate={onNavigate} id={id} />
        </main>
      </div>
    </div>
  )
}
