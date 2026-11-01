'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowRight, Loader2, Send, Trophy, Lightbulb, Eye, CheckCircle2,
  Info, RotateCcw, MessageSquareWarning
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost } from '@/lib/api'
import { Header } from '@/components/shared/header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ANSWER_TYPE_LABELS, type AnswerType } from '@/lib/constants'

type Website = { id: string; name: string; url: string }
type QuestionInSummary = {
  questionVersionId: string
  text: string
  answerType: string
  isRequired: boolean
  options: Array<{ text: string; value: string }>
  category: { id: string; name: string } | null
  answersByWebsite: Record<string, string>
}
type SummaryData = {
  id: string
  title: string
  status: string
  websites: Website[]
  groupedQuestions: Array<{ category: any; questions: QuestionInSummary[] }>
  summary: {
    bestWebsiteId: string | null
    bestWebsiteName: string | null
    reason: string | null
    lessonLearned: string | null
  } | null
  finalOpinion: { bestWebsiteId?: string; bestWebsiteName?: string; reason?: string; lessonLearned?: string } | null
}

const ANSWER_TYPE_LABELS_LOCAL = ANSWER_TYPE_LABELS

function displayValue(value: string | undefined, answerType: string, options: Array<{ text: string; value: string }>): string {
  if (!value) return '—'
  if (answerType === 'MULTIPLE_CHOICE') {
    try {
      const arr: string[] = JSON.parse(value)
      return arr.map((v) => options.find((o) => o.value === v)?.text ?? v).join('، ')
    } catch { return value }
  }
  if (['SINGLE_CHOICE', 'YES_NO', 'RATING_LEVELS'].includes(answerType)) {
    return options.find((o) => o.value === value)?.text ?? value
  }
  if (answerType === 'RATING_1_5') {
    return `${value}/5`
  }
  return value
}

export function SummaryPage({ user, comparisonId, onNavigate }: { user: any; comparisonId: string; onNavigate: (p: Record<string, string>) => void }) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bestWebsiteId, setBestWebsiteId] = useState('')
  const [reason, setReason] = useState('')
  const [lessonLearned, setLessonLearned] = useState('')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  useEffect(() => {
    apiGet<SummaryData>(`/api/comparisons/${comparisonId}/summary`)
      .then((d) => {
        setData(d)
        // Initialize opinion fields from existing summary/finalOpinion
        const existing = d.summary ?? d.finalOpinion
        setBestWebsiteId(existing?.bestWebsiteId ?? '')
        setReason(existing?.reason ?? '')
        setLessonLearned(existing?.lessonLearned ?? '')
      })
      .catch((err) => toast.error(err.message ?? 'تعذّر تحميل النتيجة'))
      .finally(() => setLoading(false))
  }, [comparisonId])

  const readOnly = data && !['DRAFT', 'COMPLETED', 'NEEDS_REVISION'].includes(data.status)
  const needsRevision = data?.status === 'NEEDS_REVISION'

  async function handleSubmit() {
    if (!data) return
    if (!bestWebsiteId) { toast.error('اختر الموقع الأفضل من وجهة نظرك'); return }
    if (reason.trim().length < 10) { toast.error('يرجى توضيح سبب اختيارك للموقع الأفضل (10 أحرف على الأقل)'); return }
    if (lessonLearned.trim().length < 10) { toast.error('يرجى كتابة أهم ما تعلمته (10 أحرف على الأقل)'); return }
    setSubmitting(true)
    try {
      const bestWebsite = data.websites.find((w) => w.id === bestWebsiteId)
      const res = await apiPost(`/api/comparisons/${comparisonId}/submit`, {
        finalOpinion: {
          bestWebsiteId,
          bestWebsiteName: bestWebsite?.name ?? '',
          reason: reason.trim(),
          lessonLearned: lessonLearned.trim(),
        },
      })
      toast.success(res.message ?? 'تم إرسال التحليل بنجاح')
      onNavigate({ view: 'student', section: 'dashboard' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
      setShowSubmitConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header user={user} onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <button onClick={() => onNavigate({ view: 'student', section: 'analysis', id: comparisonId })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ArrowRight className="h-4 w-4" /> عودة للأسئلة
        </button>

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{data.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">النتيجة النهائية للمقارنة</p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        {needsRevision && (
          <Alert className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <RotateCcw className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">أعادت الإدارة هذا التحليل للتعديل</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
              يرجى مراجعة إجاباتك وتعديل ما يلزم ثم إعادة الإرسال. الملاحظات الإدارية متاحة في صفحة المراجعة.
            </AlertDescription>
          </Alert>
        )}

        {/* Comparison Table - per category */}
        <div className="space-y-6 mb-8">
          {data.groupedQuestions.map((group, gi) => (
            <Card key={gi}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">{gi + 1}</span>
                  {group.category?.name ?? 'أسئلة'}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] text-right">معيار المقارنة</TableHead>
                      {data.websites.map((w) => (
                        <TableHead key={w.id} className="min-w-[180px] text-right font-bold">{w.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.questions.map((q) => (
                      <TableRow key={q.questionVersionId}>
                        <TableCell className="font-medium text-sm">
                          {q.text}
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {ANSWER_TYPE_LABELS_LOCAL[q.answerType as AnswerType] ?? q.answerType}
                          </div>
                        </TableCell>
                        {data.websites.map((w) => (
                          <TableCell key={w.id} className="text-sm align-top">
                            {displayValue(q.answersByWebsite[w.id], q.answerType, q.options)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final opinion */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              رأي الطالب النهائي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>أي موقع كان الأفضل من وجهة نظرك؟ <span className="text-rose-500">*</span></Label>
              <Select value={bestWebsiteId} onValueChange={setBestWebsiteId} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="اختر الموقع الأفضل" /></SelectTrigger>
                <SelectContent>
                  {data.websites.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>لماذا اخترته؟ <span className="text-rose-500">*</span></Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اذكر الأسباب التي جعلتك تفضل هذا الموقع..."
                rows={4}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                ما أهم شيء تعلمته من هذه المقارنة؟ <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                value={lessonLearned}
                onChange={(e) => setLessonLearned(e.target.value)}
                placeholder="اكتب أهم ما تعلمته من هذه التجربة المقارنة..."
                rows={4}
                disabled={readOnly}
              />
            </div>

            {!readOnly && (
              <div className="border-t border-border pt-4">
                <Alert className="mb-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    قبل الإرسال: تأكد من اكتمال الأسئلة الإلزامية. بعد الإرسال، سيظهر التحليل للإدارة للمراجعة، ولا يمكن تعديله إلا إذا أعادته الإدارة.
                  </AlertDescription>
                </Alert>
                {!showSubmitConfirm ? (
                  <Button onClick={() => setShowSubmitConfirm(true)} size="lg" className="w-full sm:w-auto">
                    <Send className="h-4 w-4 ml-2" /> إرسال التحليل إلى الإدارة
                  </Button>
                ) : (
                  <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                      تأكيد الإرسال — هل أنت متأكد؟
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc pr-5 space-y-1">
                      <li>سيتم إعلام الإدارة بتحليلك للمراجعة.</li>
                      <li>لن تتمكن من تعديل الإجابات بعد الإرسال (إلا إذا طُلب منك التعديل).</li>
                      <li>قد يظهر تحليلك لزملائك وفق إعدادات النشر.</li>
                    </ul>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                        {submitting ? 'جارٍ الإرسال...' : 'نعم، أرسل التحليل'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>إلغاء</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {readOnly && data.summary && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="font-medium">الموقع الأفضل: <span className="text-primary">{data.summary.bestWebsiteName ?? '—'}</span></div>
                <div><strong>السبب:</strong> {data.summary.reason}</div>
                <div><strong>أهم ما تعلمته:</strong> {data.summary.lessonLearned}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public view back button */}
        {readOnly && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => onNavigate({ view: 'student', section: 'dashboard' })}>
              <ArrowRight className="h-4 w-4 ml-1" /> عودة للوحة
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
