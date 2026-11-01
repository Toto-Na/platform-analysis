'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Plus, Pencil, Archive, Trash2, Eye, Loader2, ArrowUp, ArrowDown,
  HelpCircle, Rocket, Info, Save, X, Plus as PlusIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { ANSWER_TYPE_LABELS, type AnswerType } from '@/lib/constants'

type Category = { id: string; name: string }
type QuestionOption = { id?: string; text: string; value: string; sortOrder?: number }
type Question = {
  id: string; text: string; description: string | null
  answerType: string; answerTypeLabel: string
  isRequired: boolean; sortOrder: number; status: string
  currentVersionNumber: number
  category: Category
  options: QuestionOption[]
  createdAt: string
}

const ANSWER_TYPES = Object.entries(ANSWER_TYPE_LABELS) as [AnswerType, string][]

export function AdminQuestions(_: any) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [editing, setEditing] = useState<Question | null>(null)
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<Question | null>(null)
  const [publishing, setPublishing] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory) params.set('categoryId', filterCategory)
    if (filterType) params.set('answerType', filterType)
    if (filterStatus) params.set('status', filterStatus)
    try {
      const [q, c] = await Promise.all([
        apiGet<{ questions: Question[] }>(`/api/admin/questions?${params}`),
        apiGet<Category[]>('/api/questions/categories'),
      ])
      setQuestions(q.questions)
      setCategories(c)
    } catch (e: any) {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterCategory, filterType, filterStatus])

  async function publishVersion() {
    setPublishing(true)
    try {
      const res = await apiPost('/api/admin/questions/publish', { label: `الإصدار ${new Date().toLocaleString('ar')}` })
      toast.success(res.message)
    } catch (e: any) { toast.error(e.message) } finally { setPublishing(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأسئلة</h1>
          <p className="text-sm text-muted-foreground mt-1">{questions.length} سؤال</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={publishVersion} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Rocket className="h-4 w-4 ml-2" />}
            نشر إصدار جديد
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 ml-2" /> إضافة سؤال</Button>
        </div>
      </div>

      <Alert className="border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-900">
        <Info className="h-4 w-4 text-teal-700" />
        <AlertTitle className="text-teal-800 dark:text-teal-200 text-sm">نظام الإصدارات</AlertTitle>
        <AlertDescription className="text-teal-700 dark:text-teal-300 text-xs">
          عند تعديل سؤال، يبقى مرتبطًا بالتحليلات السابقة بإصداره القديم. اضغط «نشر إصدار جديد» ليظهر التعديل للطلاب في المقارنات الجديدة فقط.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue placeholder="كل الأقسام" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
              <SelectContent>
                {ANSWER_TYPES.map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="INACTIVE">معطل</SelectItem>
                <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
                <SelectItem value="ALL">الكل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>السؤال</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="text-center">إلزامي</TableHead>
                  <TableHead>الإصدار</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : questions.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد أسئلة. اضغط «إضافة سؤال» للبدء.</TableCell></TableRow>
                ) : questions.map((q, i) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium max-w-md">
                      <div className="line-clamp-2">{q.text}</div>
                    </TableCell>
                    <TableCell className="text-xs">{q.category.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{q.answerTypeLabel}</Badge></TableCell>
                    <TableCell className="text-center">{q.isRequired ? '✓' : '—'}</TableCell>
                    <TableCell className="text-xs">v{q.currentVersionNumber}</TableCell>
                    <TableCell>
                      <Badge variant={q.status === 'ACTIVE' ? 'default' : q.status === 'ARCHIVED' ? 'destructive' : 'outline'} className="text-xs">
                        {q.status === 'ACTIVE' ? 'نشط' : q.status === 'ARCHIVED' ? 'مؤرشف' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreview(q)} title="معاينة"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(q)} title="تعديل"><Pencil className="h-3.5 w-3.5" /></Button>
                        {q.status !== 'ARCHIVED' ? (
                          <Button size="sm" variant="ghost" onClick={async () => { if (confirm('أرشفة هذا السؤال؟')) { try { await apiPost(`/api/admin/questions/${q.id}/archive`); toast.success('تمت الأرشفة'); load() } catch (e: any) { toast.error(e.message) } } }} title="أرشفة"><Archive className="h-3.5 w-3.5 text-amber-600" /></Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={async () => { try { await apiPost(`/api/admin/questions/${q.id}/activate`); toast.success('تم التفعيل'); load() } catch (e: any) { toast.error(e.message) } }} title="تفعيل"><Plus className="h-3.5 w-3.5 text-emerald-600" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {(editing || creating) && (
        <QuestionDialog
          question={editing}
          categories={categories}
          onClose={() => { setEditing(null); setCreating(false) }}
          onSaved={() => { setEditing(null); setCreating(false); load() }}
        />
      )}

      {preview && (
        <PreviewDialog question={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function QuestionDialog({ question, categories, onClose, onSaved }: any) {
  const [categoryId, setCategoryId] = useState(question?.categoryId ?? question?.category?.id ?? '')
  const [text, setText] = useState(question?.text ?? '')
  const [description, setDescription] = useState(question?.description ?? '')
  const [answerType, setAnswerType] = useState<AnswerType>(question?.answerType ?? 'LONG_TEXT')
  const [isRequired, setIsRequired] = useState(question?.isRequired ?? true)
  const [sortOrder, setSortOrder] = useState(question?.sortOrder ?? 1)
  const [options, setOptions] = useState<QuestionOption[]>(question?.options ?? [])
  const [saving, setSaving] = useState(false)

  const needsOptions = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING_LEVELS', 'YES_NO'].includes(answerType)

  function addOption() {
    setOptions([...options, { text: '', value: '', sortOrder: options.length }])
  }
  function updateOption(idx: number, field: 'text' | 'value', val: string) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, [field]: val } : o)))
  }
  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!categoryId) { toast.error('اختر القسم'); return }
    if (text.trim().length < 3) { toast.error('نص السؤال قصير جدًا'); return }
    if (needsOptions && options.length === 0) { toast.error('أضف خيارًا واحدًا على الأقل'); return }
    if (needsOptions) {
      for (const o of options) {
        if (!o.text.trim() || !o.value.trim()) { toast.error('كل خيار يحتاج إلى نص وقيمة'); return }
      }
    }
    setSaving(true)
    try {
      const data: any = {
        categoryId,
        text: text.trim(),
        description: description.trim() || null,
        answerType,
        isRequired,
        sortOrder,
        options: options.map((o, i) => ({ text: o.text.trim(), value: o.value.trim(), sortOrder: i })),
      }
      if (question) {
        await apiPut(`/api/admin/questions/${question.id}`, data)
        toast.success('تم تحديث السؤال. انشر إصدارًا جديدًا ليظهر للطلاب')
      } else {
        await apiPost('/api/admin/questions', data)
        toast.success('تم إنشاء السؤال. انشر إصدارًا جديدًا ليظهر للطلاب')
      }
      onSaved()
    } catch (e: any) { toast.error(e.message); setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{question ? 'تعديل سؤال' : 'إضافة سؤال جديد'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>نص السؤال</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="اكتب نص السؤال بوضوح..." />
          </div>
          <div className="space-y-1">
            <Label>وصف إضافي (اختياري)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضيح أو مثال للطالب" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>القسم</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: Category) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>نوع الإجابة</Label>
              <Select value={answerType} onValueChange={(v) => { setAnswerType(v as AnswerType); if (!needsOptions) setOptions([]) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANSWER_TYPES.map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>ترتيب السؤال</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} />
            </div>
            <div className="flex items-center gap-3 pt-7">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <Label>سؤال إلزامي</Label>
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label>خيارات الإجابة</Label>
                <Button size="sm" variant="outline" onClick={addOption}><PlusIcon className="h-3.5 w-3.5 ml-1" /> إضافة خيار</Button>
              </div>
              {options.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد خيارات. اضغط «إضافة خيار».</p>
              ) : (
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="نص الخيار" value={o.text} onChange={(e) => updateOption(i, 'text', e.target.value)} className="flex-1" />
                      <Input placeholder="القيمة (value)" value={o.value} onChange={(e) => updateOption(i, 'value', e.target.value)} className="w-32" dir="ltr" />
                      <Button size="sm" variant="ghost" onClick={() => removeOption(i)} className="text-rose-600"><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreviewDialog({ question, onClose }: { question: Question; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> معاينة السؤال</DialogTitle></DialogHeader>
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <Label className="font-medium">{question.text}{question.isRequired && <span className="text-rose-500 mr-1">*</span>}</Label>
            <Badge variant="secondary" className="text-xs">{question.answerTypeLabel}</Badge>
          </div>
          {question.description && <p className="text-xs text-muted-foreground">{question.description}</p>}
          <div className="bg-background rounded-lg p-3 border border-border">
            <PreviewAnswer question={question} />
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>إغلاق</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreviewAnswer({ question }: { question: Question }) {
  switch (question.answerType) {
    case 'SHORT_TEXT': return <Input placeholder="إجابة قصيرة..." disabled />
    case 'LONG_TEXT': return <Textarea placeholder="اكتب إجابتك..." rows={3} disabled />
    case 'SINGLE_CHOICE':
    case 'YES_NO':
      return (
        <div className="space-y-2">
          {question.options.map((o) => (
            <div key={o.id ?? o.value} className="flex items-center gap-2 p-2 rounded border border-border">
              <div className="w-4 h-4 rounded-full border-2 border-muted" />
              <span className="text-sm">{o.text}</span>
            </div>
          ))}
        </div>
      )
    case 'RATING_LEVELS':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {question.options.map((o) => (
            <div key={o.id ?? o.value} className="text-center p-2 rounded border border-border text-sm">{o.text}</div>
          ))}
        </div>
      )
    case 'RATING_1_5': return <div className="text-center text-sm text-muted-foreground py-4">منزلق من 1 إلى 5</div>
    case 'URL': return <Input placeholder="https://..." dir="ltr" disabled />
    default: return null
  }
}
