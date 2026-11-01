'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, UserX, FileText, CheckCircle2, Send, Eye, Globe, Clock, Activity } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { StatusBadge } from '@/components/shared/status-badge'

type DashboardData = {
  stats: {
    totalStudents: number
    activeStudents: number
    inactiveStudents: number
    totalComparisons: number
    approvedComparisons: number
    submittedComparisons: number
    underReviewComparisons: number
    needsRevisionComparisons: number
    totalWebsitesStudied: number
  }
  recentComparisons: Array<{
    id: string; title: string; status: string
    studentName: string; websites: string; updatedAt: string
  }>
  recentLogs: Array<{
    id: string; action: string; description: string | null
    user: { name: string } | null; createdAt: string
  }>
}

export function AdminDashboard({ user, onNavigate }: any) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<DashboardData>('/api/admin/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = data ? [
    { label: 'إجمالي الطلاب', value: data.stats.totalStudents, icon: Users, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
    { label: 'الطلاب النشطون', value: data.stats.activeStudents, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'الطلاب غير النشطين', value: data.stats.inactiveStudents, icon: UserX, color: 'text-slate-600 bg-slate-100 dark:bg-slate-900/40' },
    { label: 'إجمالي المقارنات', value: data.stats.totalComparisons, icon: FileText, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30' },
    { label: 'التحليلات المعتمدة', value: data.stats.approvedComparisons, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'التحليلات المرسلة', value: data.stats.submittedComparisons, icon: Send, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    { label: 'قيد المراجعة', value: data.stats.underReviewComparisons, icon: Eye, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
    { label: 'تحتاج تعديل', value: data.stats.needsRevisionComparisons, icon: Clock, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
    { label: 'إجمالي المواقع المدروسة', value: data.stats.totalWebsitesStudied, icon: Globe, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة تحكم الإدارة</h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : cards.map((c, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{c.value}</div>
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent comparisons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              أحدث المقارنات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : data?.recentComparisons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد مقارنات بعد</p>
            ) : (
              data?.recentComparisons.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onNavigate({ view: 'admin', section: 'review', id: c.id })}
                  className="w-full text-right flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.studentName} · {c.websites}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent audit logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              آخر العمليات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : data?.recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد عمليات بعد</p>
            ) : (
              data?.recentLogs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{l.description ?? l.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.user?.name ?? 'النظام'} · {new Date(l.createdAt).toLocaleString('ar')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
