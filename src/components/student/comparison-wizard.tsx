'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, Plus, Trash2, ExternalLink, Globe, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiPost } from '@/lib/api'
import { Header } from '@/components/shared/header'
import { Progress } from '@/components/ui/progress'

type Website = { name: string; url: string; businessType?: string }

export function ComparisonWizard({ user, onNavigate }: { user: any; onNavigate: (p: Record<string, string>) => void }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [websites, setWebsites] = useState<Website[]>([
    { name: '', url: '', businessType: '' },
    { name: '', url: '', businessType: '' },
  ])
  const [submitting, setSubmitting] = useState(false)

  function addWebsite() {
    if (websites.length >= 4) { toast.error('الحد الأقصى 4 مواقع'); return }
    setWebsites([...websites, { name: '', url: '', businessType: '' }])
  }
  function removeWebsite(idx: number) {
    if (websites.length <= 2) { toast.error('الحد الأدنى موقعان'); return }
    setWebsites(websites.filter((_, i) => i !== idx))
  }
  function updateWebsite(idx: number, field: keyof Website, value: string) {
    setWebsites(websites.map((w, i) => (i === idx ? { ...w, [field]: value } : w)))
  }

  function next() {
    if (step === 1) {
      if (title.trim().length < 3) { toast.error('أدخل عنوانًا للمقارنة (3 أحرف على الأقل)'); return }
      setStep(2)
    } else if (step === 2) {
      // validate websites
      for (let i = 0; i < websites.length; i++) {
        if (!websites[i].name.trim()) { toast.error(`أدخل اسم الموقع رقم ${i + 1}`); return }
        if (!websites[i].url.trim()) { toast.error(`أدخل رابط الموقع رقم ${i + 1}`); return }
        try { new URL(websites[i].url) } catch { toast.error(`رابط الموقع رقم ${i + 1} غير صالح`); return }
      }
      setStep(3)
    }
  }
  function back() { if (step > 1) setStep(step - 1) }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await apiPost('/api/comparisons', {
        title: title.trim(),
        websites: websites.map((w) => ({
          name: w.name.trim(),
          url: w.url.trim(),
          businessType: w.businessType?.trim() || null,
        })),
      })
      toast.success('تم إنشاء المقارنة بنجاح. لنبدأ التحليل!')
      onNavigate({ view: 'student', section: 'analysis', id: res.id })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <button onClick={() => onNavigate({ view: 'student', section: 'dashboard' })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowRight className="h-4 w-4" /> عودة للوحة الطالب
          </button>
          <h1 className="text-2xl font-bold mb-1">إنشاء مقارنة جديدة</h1>
          <Progress value={progress} className="h-2 mt-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className={step >= 1 ? 'text-primary font-medium' : ''}>① اسم المقارنة</span>
            <span className={step >= 2 ? 'text-primary font-medium' : ''}>② اختيار المواقع</span>
            <span className={step >= 3 ? 'text-primary font-medium' : ''}>③ المراجعة والبدء</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">لنبدأ رحلة تحليل المواقع الإلكترونية</CardTitle>
              <p className="text-sm text-muted-foreground">
                اختر المواقع التي تريد تحليلها ومقارنتها. تصفح كل موقع كما لو كنت عميلًا حقيقيًا يبحث عن شراء منتج أو طلب خدمة.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">اسم المقارنة</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقارنة متاجر بيع الملابس الإلكترونية"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">اختر اسمًا واضحًا يصف موضوع المقارنة</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>التالي <ArrowLeft className="h-4 w-4 mr-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اختر المواقع التي تريد تحليلها</CardTitle>
              <p className="text-sm text-muted-foreground">يمكنك اختيار من 2 إلى 4 مواقع. تأكد من صحة الروابط.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {websites.map((w, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">الموقع {idx + 1}</span>
                    {websites.length > 2 && (
                      <Button size="sm" variant="ghost" onClick={() => removeWebsite(idx)} className="text-rose-600 hover:text-rose-700 h-7">
                        <Trash2 className="h-3.5 w-3.5 ml-1" /> إزالة
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">اسم الموقع</Label>
                      <Input value={w.name} onChange={(e) => updateWebsite(idx, 'name', e.target.value)} placeholder="مثال: Amazon" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">رابط الموقع (URL)</Label>
                      <div className="flex gap-2">
                        <Input value={w.url} onChange={(e) => updateWebsite(idx, 'url', e.target.value)} placeholder="https://www.amazon.com" dir="ltr" />
                        {w.url && (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              try { window.open(new URL(w.url).href, '_blank', 'noopener,noreferrer') } catch { toast.error('الرابط غير صالح') }
                            }}
                            title="فتح الموقع في تبويب جديد"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">نوع النشاط (اختياري)</Label>
                    <Input value={w.businessType ?? ''} onChange={(e) => updateWebsite(idx, 'businessType', e.target.value)} placeholder="مثال: B2C، متجر ملابس، سوق متعدد" />
                  </div>
                </div>
              ))}
              {websites.length < 4 && (
                <Button variant="outline" onClick={addWebsite} className="w-full border-dashed">
                  <Plus className="h-4 w-4 ml-2" /> إضافة موقع رابع
                </Button>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={back}><ArrowRight className="h-4 w-4 ml-1" /> السابق</Button>
                <Button onClick={next}>التالي <ArrowLeft className="h-4 w-4 mr-1" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مراجعة وبدء المقارنة</CardTitle>
              <p className="text-sm text-muted-foreground">تأكد من البيانات قبل البدء. يمكنك تعديلها قبل الإرسال فقط.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <div className="text-xs text-muted-foreground">عنوان المقارنة</div>
                <div className="font-medium">{title}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">المواقع المختارة ({websites.length})</div>
                {websites.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{w.name}</div>
                      <div className="text-xs text-muted-foreground truncate" dir="ltr">{w.url}</div>
                    </div>
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70">
                      <Globe className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                <strong>تنبيه:</strong> لا تنفّذوا شراءً حقيقيًا ولا تدخلوا بيانات شخصية أو بيانات دفع أثناء التصفح.
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={back}><ArrowRight className="h-4 w-4 ml-1" /> السابق</Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
                  {submitting ? 'جارٍ الإنشاء...' : 'ابدأ المقارنة'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
