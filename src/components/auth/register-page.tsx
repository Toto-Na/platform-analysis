'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus, ArrowRight, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

type Level = { id: string; name: string }

export function RegisterPage({ onNavigate }: { onNavigate: (params: Record<string, string>) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [academicLevelId, setAcademicLevelId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [levels, setLevels] = useState<Level[]>([])

  useEffect(() => {
    apiGet<Level[]>('/api/academic-levels').then(setLevels).catch(() => {})
  }, [])

  function passwordStrength(p: string): { score: number; label: string; color: string } {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^a-zA-Z0-9]/.test(p)) score++
    const labels = ['ضعيفة', 'متوسطة', 'جيدة', 'قوية', 'قوية جدًا']
    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500']
    return { score, label: labels[score] ?? 'ضعيفة', color: colors[score] ?? 'bg-rose-500' }
  }
  const strength = passwordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { toast.error('كلمتا المرور غير متطابقتين'); return }
    if (strength.score < 2) { toast.error('كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع أرقام وحروف'); return }
    setLoading(true)
    try {
      const res = await apiPost('/api/auth/register', { name, email, password, confirmPassword, academicLevelId: academicLevelId || null })
      toast.success(res.message ?? 'تم إنشاء الحساب بنجاح')
      onNavigate({ view: 'login' })
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
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إنشاء حساب طالب جديد</h1>
              <p className="text-sm text-muted-foreground mt-1">سجّل الآن لتبدأ رحلة تحليل المواقع الإلكترونية</p>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" required minLength={3} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@demo.edu" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="level">المستوى الدراسي</Label>
                <Select value={academicLevelId} onValueChange={setAcademicLevelId}>
                  <SelectTrigger><SelectValue placeholder="اختر المستوى الدراسي" /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                {password && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                    </div>
                    <span className="text-muted-foreground">{strength.label}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
                <Input id="confirm" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <UserPlus className="h-4 w-4 ml-2" />}
                {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <button onClick={() => onNavigate({ view: 'login' })} className="text-primary font-medium hover:underline mr-1">تسجيل الدخول</button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
