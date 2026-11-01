'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, History } from 'lucide-react'
import { apiGet } from '@/lib/api'

type Log = {
  id: string; action: string; targetType: string | null; targetId: string | null
  description: string | null
  user: { name: string; email: string; role: string } | null
  createdAt: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_REGISTER: { label: 'تسجيل طالب', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  ADMIN_LOGIN: { label: 'دخول إداري', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  PASSWORD_RESET: { label: 'إعادة تعيين كلمة مرور', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  QUESTION_CREATE: { label: 'إضافة سؤال', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
  QUESTION_UPDATE: { label: 'تعديل سؤال', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
  QUESTION_ARCHIVE: { label: 'أرشفة سؤال', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  QUESTION_SET_PUBLISH: { label: 'نشر إصدار أسئلة', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  CATEGORY_CREATE: { label: 'إضافة قسم', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  CATEGORY_UPDATE: { label: 'تعديل قسم', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  CATEGORY_DELETE: { label: 'حذف قسم', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  STUDENT_CREATE: { label: 'إضافة طالب', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  STUDENT_UPDATE: { label: 'تعديل طالب', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  STUDENT_DISABLE: { label: 'تعطيل طالب', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  COMPARISON_CREATE: { label: 'إنشاء مقارنة', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  COMPARISON_SUBMIT: { label: 'إرسال مقارنة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  COMPARISON_APPROVE: { label: 'اعتماد مقارنة', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  COMPARISON_REVISION: { label: 'إعادة مقارنة', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  COMPARISON_DELETE: { label: 'حذف مقارنة', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
}

export function AdminAuditLogs(_: any) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterAction) params.set('action', filterAction)
    try { const r = await apiGet<{ logs: Log[] }>(`/api/admin/audit-logs?${params}`); setLogs(r.logs) } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterAction])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">سجل العمليات</h1>
          <p className="text-sm text-muted-foreground mt-1">{logs.length} عملية</p>
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-56"><SelectValue placeholder="كل العمليات" /></SelectTrigger>
          <SelectContent>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><History className="h-10 w-10 mx-auto mb-2 opacity-40" />لا توجد عمليات</div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto scrollbar-thin">
              {logs.map((l) => {
                const meta = ACTION_LABELS[l.action] ?? { label: l.action, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
                return (
                  <div key={l.id} className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <Badge className={`text-xs shrink-0 ${meta.color}`}>{meta.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{l.description ?? l.action}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {l.user?.name ?? 'النظام'} · {new Date(l.createdAt).toLocaleString('ar')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
