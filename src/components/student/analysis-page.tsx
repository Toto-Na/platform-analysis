'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowRight, ExternalLink, Save, CheckCircle2, Loader2, Clock, AlertCircle,
  Globe, FileText, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPut } from '@/lib/api'
import { Header } from '@/components/shared/header'
import { QuestionRenderer, type QuestionDef } from './question-renderer'

type Website = { id: string; name: string; url: string; businessType?: string | null }
type Answer = { questionVersionId: string; value: string }

type ComparisonData = {
  id: string
  title: string
  status: string
  websites: Website[]
  questions: QuestionDef[]
  answers: Answer[]
}

export function AnalysisPage({ user, comparisonId, onNavigate }: { user: any; comparisonId: string; onNavigate: (p: Record<string, string>) => void }) {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeWebsiteId, setActiveWebsiteId] = useState<string>('')
  // answersByWebsite: { [websiteId]: { [questionVersionId]: value } }
  const [answersByWebsite, setAnswersByWebsite] = useState<Record<string, Record<string, string>>>({})
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)

  // Pending answers queue (for autosave)
  const pendingRef = useRef<Record<string, Record<string, string>>>({})
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    apiGet<ComparisonData>(`/api/comparisons/${comparisonId}`)
      .then((d) => {
        setData(d)
        // Initialize answers from server
        const map: Record<string, Record<string, string>> = {}
        for (const w of d.websites) map[w.id] = {}
        for (const a of d.answers) {
          if (!map[a.questionVersionId]) {
            // need to find which website this answer belongs to
          }
        }
        // answers don't include websiteId in our type — let's fix by re-fetching
        // We have answers in the comparison response, but the type doesn't have websiteId
        // Looking at the API: it returns answers: [{id, websiteId, questionVersionId, value, updatedAt}]
        // Let's cast to any
        const anyAnswers = d.answers as any[]
        for (const a of anyAnswers) {
          if (a.websiteId) {
            if (!map[a.websiteId]) map[a.websiteId] = {}
            map[a.websiteId][a.questionVersionId] = a.value
          }
        }
        setAnswersByWebsite(map)
        pendingRef.current = JSON.parse(JSON.stringify(map))
        setActiveWebsiteId(d.websites[0]?.id ?? '')
      })
      .catch((err) => {
        toast.error(err.message ?? 'تعذّر تحميل المقارنة')
      })
      .finally(() => setLoading(false))
  }, [comparisonId])

  // Debounced autosave
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState('saving')
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingRef.current
      const websiteIds = Object.keys(pending)
      const allAnswers: Array<{ websiteId: string; questionVersionId: string; value: string }> = []
      for (const wid of websiteIds) {
        for (const [qvid, value] of Object.entries(pending[wid])) {
          allAnswers.push({ websiteId: wid, questionVersionId: qvid, value })
        }
      }
      if (allAnswers.length === 0) { setSaveState('idle'); return }
      try {
        await apiPut(`/api/comparisons/${comparisonId}/answers`, { answers: allAnswers })
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch (err: any) {
        setSaveState('error')
        toast.error('تعذّر حفظ الإجابات: ' + (err.message ?? ''))
      }
    }, 1200)
  }, [comparisonId])

  function updateAnswer(websiteId: string, questionVersionId: string, value: string) {
    setAnswersByWebsite((prev) => {
      const next = { ...prev }
      if (!next[websiteId]) next[websiteId] = {}
      next[websiteId] = { ...next[websiteId], [questionVersionId]: value }
      return next
    })
    pendingRef.current = JSON.parse(JSON.stringify(answersByWebsite))
    if (!pendingRef.current[websiteId]) pendingRef.current[websiteId] = {}
    pendingRef.current[websiteId][questionVersionId] = value
    scheduleSave()
  }

  // Calculate completion %
  const totalQuestions = (data?.questions.length ?? 0) * (data?.websites.length ?? 0)
  const answeredCount = (() => {
    let c = 0
    for (const w of data?.websites ?? []) {
      const wans = answersByWebsite[w.id] ?? {}
      for (const q of data?.questions ?? []) {
        if (wans[q.questionVersionId] && wans[q.questionVersionId].toString().trim()) c++
      }
    }
    return c
  })()
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // Group questions by category
  const groupedQuestions = (() => {
    const groups: Record<string, { name: string; questions: any[] }> = {}
    for (const q of data?.questions ?? []) {
      // The category isn't in our QuestionDef type, let's read from raw question
      const cat = (q as any).category
      const catId = cat?.id ?? 'uncat'
      const catName = cat?.name ?? 'أسئلة'
      if (!groups[catId]) groups[catId] = { name: catName, questions: [] }
      groups[catId].questions.push(q)
    }
    return Object.values(groups)
  })()

  const readOnly = data && !['DRAFT', 'COMPLETED', 'NEEDS_REVISION'].includes(data.status)

  async function handleSubmit() {
    if (!data) return
    if (answeredCount < totalQuestions) {
      const missing = totalQuestions - answeredCount
      const ok = confirm(`لديك ${missing} سؤال بدون إجابة. هل تريد المتابعة للنتيجة النهائية على أي حال؟`)
      if (!ok) return
    }
    onNavigate({ view: 'student', section: 'summary', id: data.id })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header user={user} onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header user={user} onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
              <p className="text-muted-foreground">تعذّر تحميل المقارنة</p>
              <Button className="mt-4" variant="outline" onClick={() => onNavigate({ view: 'student', section: 'dashboard' })}>عودة للوحة</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Header section */}
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <button onClick={() => onNavigate({ view: 'student', section: 'dashboard' })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
              <ArrowRight className="h-4 w-4" /> عودة للوحة
            </button>
            <h1 className="text-xl md:text-2xl font-bold">{data.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              الطالب: {user.name}
              {readOnly && ' · للقراءة فقط'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SaveStateIndicator state={saveState} />
            {!readOnly && (
              <Button onClick={handleSubmit} size="sm">
                <FileText className="h-4 w-4 ml-1" /> الانتقال للنتيجة النهائية
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <Card className="mb-4">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">نسبة الإنجاز</span>
              <span className="font-medium">{answeredCount} / {totalQuestions} سؤال مجاب</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Instruction */}
        <Alert className="mb-4 border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-900">
          <Globe className="h-4 w-4 text-teal-700" />
          <AlertTitle className="text-teal-800 dark:text-teal-200">تعليمات التحليل</AlertTitle>
          <AlertDescription className="text-teal-700 dark:text-teal-300 text-sm">
            افتحوا الموقع المخصص لكم، وتصفّحوه كما لو كنتم عملاء يريدون شراء منتج أو طلب خدمة. ثم أجيبوا عن الأسئلة بناءً على تجربتكم الفعلية.
            <br />
            <strong>لا تنفّذوا شراءً حقيقيًا ولا تدخلوا بيانات شخصية أو بيانات دفع.</strong>
          </AlertDescription>
        </Alert>

        {/* Website tabs */}
        <Tabs value={activeWebsiteId} onValueChange={setActiveWebsiteId}>
          <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-1">
            {data.websites.map((w) => {
              const wans = answersByWebsite[w.id] ?? {}
              const cnt = (data.questions ?? []).filter((q) => wans[q.questionVersionId]?.toString().trim()).length
              const total = data.questions.length
              const done = cnt === total
              return (
                <TabsTrigger
                  key={w.id}
                  value={w.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span>{w.name}</span>
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{cnt}/{total}</Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {data.websites.map((w) => (
            <TabsContent key={w.id} value={w.id} className="mt-4">
              {/* Website header with open button */}
              <Card className="mb-4 border-primary/30">
                <CardContent className="py-3 px-4 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-bold text-base">{w.name}</div>
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary" dir="ltr">{w.url}</a>
                  </div>
                  <Button size="sm" onClick={() => window.open(w.url, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="h-4 w-4 ml-1" /> فتح الموقع
                  </Button>
                </CardContent>
              </Card>

              {/* Questions grouped by category */}
              <div className="space-y-6">
                {groupedQuestions.map((g, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3 border-b border-border bg-muted/20">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">{i + 1}</span>
                        {g.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-5">
                      {g.questions.map((q: any) => (
                        <QuestionRenderer
                          key={q.questionVersionId}
                          question={q}
                          value={answersByWebsite[w.id]?.[q.questionVersionId] ?? ''}
                          onChange={(val) => updateAnswer(w.id, q.questionVersionId, val)}
                          readOnly={readOnly}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Bottom action */}
        <div className="mt-8 flex justify-end">
          {!readOnly ? (
            <Button onClick={handleSubmit} size="lg">
              <Send className="h-4 w-4 ml-2" /> الانتقال للنتيجة النهائية
            </Button>
          ) : (
            <Button onClick={() => onNavigate({ view: 'student', section: 'summary', id: data.id })} size="lg">
              <FileText className="h-4 w-4 ml-2" /> عرض النتيجة النهائية
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

function SaveStateIndicator({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (state === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
        <Loader2 className="h-3 w-3 animate-spin" /> جارٍ الحفظ...
      </span>
    )
  if (state === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 px-2">
        <CheckCircle2 className="h-3 w-3" /> تم الحفظ
      </span>
    )
  if (state === 'error')
    return (
      <span className="flex items-center gap-1 text-xs text-rose-600 px-2">
        <AlertCircle className="h-3 w-3" /> فشل الحفظ
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground/60 px-2">
      <Clock className="h-3 w-3" /> حفظ تلقائي
    </span>
  )
}
