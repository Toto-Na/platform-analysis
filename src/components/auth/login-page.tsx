'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, LogIn, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

export function LoginPage({ onNavigate }: { onNavigate: (params: Record<string, string>) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور')
        setLoading(false)
        return
      }
      const r = await fetch('/api/auth/me')
      const user = await r.json()
      if (!user || !user.id) {
        toast.error('تعذّر جلب بيانات المستخدم')
        setLoading(false)
        return
      }
      toast.success(`أهلًا ${user.name} 👋`)
      if (user.role === 'ADMIN') {
        onNavigate({ view: 'admin', section: 'dashboard' })
      } else {
        onNavigate({ view: 'student', section: 'dashboard' })
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع. حاول مرة أخرى')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">منصة تحليل المواقع الإلكترونية</div>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-teal-100 dark:border-teal-900">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
              <p className="text-sm text-muted-foreground mt-1">منصة تحليل ومقارنة المواقع الإلكترونية</p>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@demo.edu" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  <span className="text-muted-foreground">تذكرني</span>
                </label>
                <button type="button" onClick={() => onNavigate({ view: 'forgot-password' })} className="text-primary hover:underline">نسيت كلمة المرور؟</button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <LogIn className="h-4 w-4 ml-2" />}
                {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-3 text-sm">
            <div className="text-muted-foreground">
              ليس لديك حساب؟{' '}
              <button type="button" onClick={() => onNavigate({ view: 'register' })} className="text-primary font-medium hover:underline">إنشاء حساب جديد</button>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg text-center leading-relaxed">
              <strong className="text-foreground">حسابات تجريبية:</strong>
              <br />
              طالب: ahmed@demo.edu / Student@123
              <br />
              مدير: admin@platform.edu / Admin@12345
            </div>
          </CardFooter>
        </Card>
      </main>
      <footer className="p-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} منصة تحليل ومقارنة المواقع الإلكترونية
      </footer>
    </div>
  )
}
