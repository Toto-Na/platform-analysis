'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiPost } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSearchParams } from 'next/navigation'

export function ResetPasswordPage({ onNavigate }: { onNavigate: (params: Record<string, string>) => void }) {
  const sp = useSearchParams()
  const token = sp.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) toast.error('رمز الاستعادة غير موجود في الرابط')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8) { toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    try {
      const res = await apiPost('/api/auth/reset-password', { token, password, confirmPassword: confirm })
      toast.success(res.message)
      setDone(true)
      setTimeout(() => onNavigate({ view: 'login' }), 2000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">استعادة كلمة المرور</div>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
          </CardHeader>
          {done ? (
            <CardContent className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-muted-foreground">تم تعيين كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول...</p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
                  <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !token}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <KeyRound className="h-4 w-4 ml-2" />}
                  {loading ? 'جارٍ الحفظ...' : 'تعيين كلمة المرور'}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </main>
    </div>
  )
}
