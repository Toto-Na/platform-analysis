'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2, Send, AlertCircle, Plus, Eye, ArrowLeft, Users } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { Header } from '@/components/shared/header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardData = {
  student: { id: string; name: string; email: string; academicLevelName: string | null }
  stats: { total: number; draft: number; completed: number; submitted: number; underReview: number; needsRevision: number; approved: number }
  comparisons: Array<{
    id: string; title: string; status: string; statusLabel: string
    websites: Array<{ id: string; name: string; url: string }>
    websiteCount: number; createdAt: string; updatedAt: string; submittedAt: string | null
  }>
}

type PublicData = {
  policy: string
  comparisons: Array<{
    id: string; title: string; status: string; statusLabel: string
    student: { name: string; academicLevel: string | null }
    websites: Array<{ id: string; name: string; url: string }>
    submittedAt: string | null
  }>
}

export function StudentDashboard({ user, onNavigate }: { user: any; onNavigate: (p: Record<string, string>) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [pub, setPub] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'mine' | 'public'>('mine')

  useEffect(() => {
    Promise.all([
      apiGet<DashboardData>('/api/student/dashboard'),
      apiGet<PublicData>('/api/student/public-comparisons'),
    ])
      .then(([d, p]) => { setData(d); setPub(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats
  const statCards = stats ? [
    { label: 'إجمالي المقارنات', value: stats.total, icon: FileText, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
    { label: 'مسودة', value: stats.draft, icon: FileText, color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/40' },
    { label: 'مرسلة', value: stats.submitted, icon: Send, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    { label: 'تحتاج تعديل', value: stats.needsRevision, icon: AlertCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
    { label: 'معتمدة', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  ] : []

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Welcome banner */}
        <div className="bg-gradient-to-l from-teal-600 to-teal-700 text-white rounded-xl p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">أهلًا، {data?.student.name ?? user.name} 👋</h1>
          <p className="text-teal-50 text-sm">
            {data?.student.academicLevelName ? `المستوى: ${data.student.academicLevelName} · ` : ''}
            جاهز لبدء تحليل موقع جديد؟
          </p>
          <Button
            className="mt-4 bg-white text-teal-700 hover:bg-teal-50 font-medium"
            onClick={() => onNavigate({ view: 'student', section: 'new-comparison' })}
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء مقارنة جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : statCards.map((s, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('mine')}
          >
            مقارناتي
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'public' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('public')}
          >
            تحليلات زملائك
          </button>
        </div>

        {tab === 'mine' ? (
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
            ) : data?.comparisons.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">لا توجد مقارنات بعد. ابدأ رحلتك الأولى في تحليل المواقع الإلكترونية</p>
                  <Button onClick={() => onNavigate({ view: 'student', section: 'new-comparison' })}>
                    <Plus className="h-4 w-4 ml-2" /> إنشاء مقارنة جديدة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              data?.comparisons.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold line-clamp-1">{c.title}</CardTitle>
                      <StatusBadge status={c.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.websites.map((w) => (
                        <Badge key={w.id} variant="secondary" className="text-xs">{w.name}</Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      آخر تعديل: {new Date(c.updatedAt).toLocaleDateString('ar')}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={() => onNavigate({ view: 'student', section: 'analysis', id: c.id })}>
                        {(c.status === 'DRAFT' || c.status === 'NEEDS_REVISION') ? 'متابعة' : 'فتح'}
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      </Button>
                      {(c.status === 'SUBMITTED' || c.status === 'APPROVED' || c.status === 'UNDER_REVIEW') && (
                        <Button size="sm" variant="outline" onClick={() => onNavigate({ view: 'student', section: 'summary', id: c.id })}>
                          <Eye className="h-3.5 w-3.5 ml-1" /> النتيجة
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            ) : pub?.comparisons.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-16 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">لا توجد تحليلات منشورة من زملائك بعد</p>
                </CardContent>
              </Card>
            ) : (
              pub?.comparisons.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold line-clamp-1">{c.title}</CardTitle>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.student.name}{c.student.academicLevel ? ` · ${c.student.academicLevel}` : ''}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.websites.map((w) => (
                        <Badge key={w.id} variant="secondary" className="text-xs">{w.name}</Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onNavigate({ view: 'student', section: 'summary', id: c.id })}>
                      <Eye className="h-3.5 w-3.5 ml-1" /> مشاهدة التحليل (للقراءة فقط)
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border bg-background">
        © {new Date().getFullYear()} منصة تحليل ومقارنة المواقع الإلكترونية
      </footer>
    </div>
  )
}
