'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowRight, CheckCircle2, RotateCcw, Loader2, ExternalLink, Trophy, Lightbulb,
  MessageSquare, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost } from '@/lib/api'
import { StatusBadge } from '@/components/shared/status-badge'
import { ANSWER_TYPE_LABELS, type AnswerType } from '@/lib/constants'

type ReviewData = {
  id: string
  title: string
  status: string
  student: any
  websites: Array<{ id: string; name: string; url: string }>
  answers: Array<{ websiteId: string; questionVersionId: string; value: string }>
  questions: Array<{
    questionVersionId: string; text: string; description: string | null
    answerType: string; isRequired: boolean
    options: Array<{ text: string; value: string }>
    category: { id: string; name: string } | null
  }>
  reviews: Array<{ action: string; notes: string | null; reviewer: { name: string }; createdAt: string }>
  summary: any
  finalOpinion: string | null
  submittedAt: string | null
}

function display(value: string | undefined, type: string, options: Array<{ text: string; value: string }>) {
  if (!value) return '—'
  if (type === 'MULTIPLE_CHOICE') { try { return JSON.parse(value).map((v: string) => options.find(o => o.value === v)?.text ?? v).join('، ') } catch { return value } }
  if (['SINGLE_CHOICE','YES_NO','RATING_LEVELS'].includes(type)) return options.find(o => o.value === value)?.text ?? value
  if (type === 'RATING_1_5') return `${value}/5`
  return value
}

export function AdminReview({ id, onNavigate }: any) {
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<'none' | 'approve' | 'revision'>('none')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    apiGet<ReviewData>(`/api/admin/comparisons/${id}`)
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function doAction() {
    if (action === 'revision' && notes.trim().length < 3) { toast.error('يرجى كتابة ملاحظات للطالب'); return }
    setSubmitting(true)
    try {
      const endpoint = action === 'approve' ? 'approve' : 'request-revision'
      const res = await apiPost(`/api/admin/comparisons/${id}/${endpoint}`, action === 'approve' ? { notes } : { notes })
      toast.success(res.message)
      onNavigate({ view: 'admin', section: 'comparisons' })
    } catch (e: any) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!data) return <div className="text-center text-muted-foreground">تعذّر تحميل المقارنة</div>

  const grouped = (() => {
    const map = new Map<string, { name: string; questions: any[] }>()
    for (const q of data.questions) {
      const cid = q.category?.id ?? 'uncat'
      const cname = q.category?.name ?? 'أسئلة'
      if (!map.has(cid)) map.set(cid, { name: cname, questions: [] })
      map.get(cid)!.questions.push(q)
    }
    return Array.from(map.values())
  })()

  return (
    <div className="space-y-4">
      <button onClick={() => onNavigate({ view: 'admin', section: 'comparisons' })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowRight className="h-4 w-4" /> عودة لقائمة المقارنات
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{data.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            الطالب: {data.student.name} · {data.student.email}
            {data.student.studentProfile?.academicLevel?.name ? ` · ${data.student.studentProfile.academicLevel.name}` : ''}
          </p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Websites */}
      <Card>
        <CardHeader><CardTitle className="text-base">المواقع المختارة</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.websites.map((w) => (
            <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 text-sm transition-colors">
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{w.name}</span>
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Answers by category */}
      {grouped.map((g, gi) => (
        <Card key={gi}>
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold">{g.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">السؤال</TableHead>
                  {data.websites.map((w) => (
                    <TableHead key={w.id} className="min-w-[160px]">{w.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.questions.map((q) => {
                  const answersByWebsite: Record<string, string> = {}
                  for (const w of data.websites) {
                    const a = data.answers.find((x) => x.websiteId === w.id && x.questionVersionId === q.questionVersionId)
                    answersByWebsite[w.id] = a?.value ?? ''
                  }
                  return (
                    <TableRow key={q.questionVersionId}>
                      <TableCell className="text-sm font-medium align-top">
                        {q.text}
                        {!q.isRequired && <Badge variant="outline" className="text-[10px] mr-2">اختياري</Badge>}
                        <div className="text-[10px] text-muted-foreground">{ANSWER_TYPE_LABELS[q.answerType as AnswerType]}</div>
                      </TableCell>
                      {data.websites.map((w) => (
                        <TableCell key={w.id} className="text-sm align-top">{display(answersByWebsite[w.id], q.answerType, q.options)}</TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Final opinion */}
      {data.summary && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> رأي الطالب النهائي</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><strong>الموقع الأفضل:</strong> <span className="text-primary font-medium">{data.summary.bestWebsiteName ?? '—'}</span></div>
            <div className="bg-muted/30 rounded-lg p-3"><strong>السبب:</strong> {data.summary.reason}</div>
            <div className="bg-muted/30 rounded-lg p-3 flex items-start gap-2"><Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /><div><strong>أهم ما تعلمه:</strong> {data.summary.lessonLearned}</div></div>
          </CardContent>
        </Card>
      )}

      {/* Previous reviews */}
      {data.reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> المراجعات السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.reviews.map((r, i) => (
              <div key={i} className="border-r-2 border-primary/40 pr-3 py-2 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={r.action === 'APPROVE' ? 'default' : 'destructive'} className="text-[10px]">{r.action === 'APPROVE' ? 'اعتماد' : 'إعادة للتعديل'}</Badge>
                  <span className="text-xs text-muted-foreground">{r.reviewer.name} · {new Date(r.createdAt).toLocaleString('ar')}</span>
                </div>
                {r.notes && <p className="text-muted-foreground">{r.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin action */}
      {['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(data.status) && (
        <Card className="border-primary/40">
          <CardHeader><CardTitle className="text-base">إجراء إداري</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className="h-16 flex-col"
              >
                <CheckCircle2 className="h-5 w-5 mb-1" />
                اعتماد التحليل
              </Button>
              <Button
                variant={action === 'revision' ? 'destructive' : 'outline'}
                onClick={() => setAction('revision')}
                className="h-16 flex-col"
              >
                <RotateCcw className="h-5 w-5 mb-1" />
                إعادة للطالب للتعديل
              </Button>
            </div>
            {action !== 'none' && (
              <div className="space-y-2">
                <Label>ملاحظات إدارية {action === 'revision' && <span className="text-rose-500">*</span>}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === 'approve' ? 'ملاحظات إضافية (اختياري)...' : 'وضح للطالب ما يحتاج إلى تعديله...'}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={doAction} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    تأكيد الإجراء
                  </Button>
                  <Button variant="outline" onClick={() => { setAction('none'); setNotes('') }}>إلغاء</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.status === 'APPROVED' && (
        <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-200">تم اعتماد هذا التحليل</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-300 text-sm">أصبح متاحًا للطلاب للاطلاع عليه ضمن تحليلات الزملاء.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
