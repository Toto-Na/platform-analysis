'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { apiGet } from '@/lib/api'
import { COMPARISON_STATUS_LABELS, type ComparisonStatus } from '@/lib/constants'
import { FileDown, FileSpreadsheet, Loader2, TrendingUp, Users, Globe, Lightbulb } from 'lucide-react'

type Overview = {
  comparisonsByLevel: Array<{ name: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
  monthlyTrend: Array<{ month: string; count: number }>
  totalComparisons: number
  totalStudents: number
  totalApproved: number
}
type WebsitesReport = {
  mostCompared: Array<{ name: string; url: string; count: number }>
  businessTypes: Array<{ type: string; count: number }>
  totalWebsitesAnalyzed: number
  uniqueWebsites: number
}
type QuestionsReport = {
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  topStrengthWords: Array<{ word: string; count: number }>
  topWeaknessWords: Array<{ word: string; count: number }>
  totalAnswers: number
}

const COLORS = ['#0F766E', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899']

export function AdminReports(_: any) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [websites, setWebsites] = useState<WebsitesReport | null>(null)
  const [questions, setQuestions] = useState<QuestionsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)

  useEffect(() => {
    Promise.all([
      apiGet<Overview>('/api/admin/reports/overview'),
      apiGet<WebsitesReport>('/api/admin/reports/websites'),
      apiGet<QuestionsReport>('/api/admin/reports/questions'),
    ]).then(([o, w, q]) => { setOverview(o); setWebsites(w); setQuestions(q) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function exportReport(format: 'pdf' | 'excel') {
    setExporting(format)
    try {
      const res = await fetch(`/api/admin/reports/export/${format}`, { credentials: 'include' })
      if (!res.ok) throw new Error('تعذّر التصدير')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `platform-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      // toast via sonner imported above
    } finally { setExporting(null) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة تحليلية شاملة على المنصة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('pdf')} disabled={!!exporting}>
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileDown className="h-4 w-4 ml-2" />}
            تصدير PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')} disabled={!!exporting}>
            {exporting === 'excel' ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileSpreadsheet className="h-4 w-4 ml-2" />}
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Users} label="إجمالي الطلاب المشاركين" value={overview?.totalStudents ?? 0} color="text-teal-600 bg-teal-50 dark:bg-teal-950/30" />
        <StatCard icon={TrendingUp} label="إجمالي المقارنات" value={overview?.totalComparisons ?? 0} color="text-sky-600 bg-sky-50 dark:bg-sky-950/30" />
        <StatCard icon={Globe} label="إجمالي المواقع المدروسة" value={websites?.totalWebsitesAnalyzed ?? 0} color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Comparisons by level */}
        <Card>
          <CardHeader><CardTitle className="text-base">المقارنات حسب المستوى الدراسي</CardTitle></CardHeader>
          <CardContent>
            {overview && overview.comparisonsByLevel.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={overview.comparisonsByLevel} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="عدد المقارنات" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">توزيع حالات المقارنات</CardTitle></CardHeader>
          <CardContent>
            {overview && overview.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={overview.statusDistribution.map((s) => ({ name: COMPARISON_STATUS_LABELS[s.status as ComparisonStatus] ?? s.status, value: s.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(e: any) => `${e.name}: ${e.value}`}
                  >
                    {overview.statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">اتجاه المقارنات خلال الأشهر الستة الماضية</CardTitle></CardHeader>
        <CardContent>
          {overview && overview.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={overview.monthlyTrend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="عدد المقارنات" stroke="#0F766E" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Most compared websites */}
        <Card>
          <CardHeader><CardTitle className="text-base">أكثر المواقع اختيارًا</CardTitle></CardHeader>
          <CardContent>
            {websites && websites.mostCompared.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={websites.mostCompared.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 5, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" name="عدد المرات" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </CardContent>
        </Card>

        {/* Business types */}
        <Card>
          <CardHeader><CardTitle className="text-base">أنواع التجارة الإلكترونية المدروسة</CardTitle></CardHeader>
          <CardContent>
            {websites && websites.businessTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={websites.businessTypes.map((t) => ({ name: t.type, value: t.count }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.name}: ${e.value}`}
                  >
                    {websites.businessTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </CardContent>
        </Card>
      </div>

      {/* Common insights */}
      <div className="grid lg:grid-cols-3 gap-4">
        <InsightCard icon={Lightbulb} title="أكثر الميزات المذكورة" items={questions?.strengths ?? []} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" />
        <InsightCard icon={Lightbulb} title="أكثر المشكلات المذكورة" items={questions?.weaknesses ?? []} color="text-rose-600 bg-rose-50 dark:bg-rose-950/30" />
        <InsightCard icon={Lightbulb} title="أكثر اقتراحات التحسين" items={questions?.improvements ?? []} color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5" /></div>
        <div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
      </CardContent>
    </Card>
  )
}

function Empty() {
  return <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية لعرضها</div>
}

function InsightCard({ icon: Icon, title, items, color }: any) {
  const top = items.slice(0, 8)
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><div className={`w-7 h-7 rounded ${color} flex items-center justify-center`}><Icon className="h-3.5 w-3.5" /></div>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
        {top.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">لا توجد إجابات بعد</p> : top.map((item: string, i: number) => (
          <div key={i} className="text-sm bg-muted/40 rounded-lg p-2 leading-relaxed">{item}</div>
        ))}
      </CardContent>
    </Card>
  )
}
