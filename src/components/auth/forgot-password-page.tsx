'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, ArrowRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { apiPost } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

export function ForgotPasswordPage({ onNavigate }: { onNavigate: (params: Record<string, string>) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResetLink(null)
    try {
      const res = await apiPost<{ message: string; resetLink?: string }>('/api/auth/forgot-password', { email })
      toast.success(res.message)
      if (res.resetLink) setResetLink(res.resetLink)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="flex items-center justify-between p-4">
        <button onClick={() => onNavigate({ view: 'login' })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" /> عودة لتسجيل الدخول
        </button>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Mail className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
              <p className="text-sm text-muted-foreground mt-1">أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة كلمة المرور</p>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@demo.edu" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Mail className="h-4 w-4 ml-2" />}
                {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}
              </Button>
              {resetLink && (
                <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-lg p-3 text-sm space-y-2">
                  <p className="text-teal-700 dark:text-teal-300 font-medium">في وضع التجربة، لا يُرسل البريد فعليًا.</p>
                  <p className="text-muted-foreground">رابط الاستعادة (انقر للانتقال إلى صفحة إعادة التعيين):</p>
                  <a href={resetLink} className="inline-flex items-center gap-1 text-primary hover:underline break-all">
                    <ExternalLink className="h-3 w-3" />
                    استخدام رابط الاستعادة
                  </a>
                </div>
              )}
            </CardContent>
          </form>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            تذكرت كلمة المرور؟{' '}
            <button onClick={() => onNavigate({ view: 'login' })} className="text-primary font-medium hover:underline mr-1">تسجيل الدخول</button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
