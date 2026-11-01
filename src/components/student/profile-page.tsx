'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, User } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPut } from '@/lib/api'
import { Header } from '@/components/shared/header'

export function ProfilePage({ user, onNavigate }: { user: any; onNavigate: (p: Record<string, string>) => void }) {
  const [name, setName] = useState(user.name ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [academicLevelId, setAcademicLevelId] = useState(user.academicLevel?.id ?? '')
  const [levels, setLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet('/api/academic-levels').then(setLevels).catch(() => {})
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      await apiPut('/api/auth/me', { name, bio, academicLevelId: academicLevelId || null })
      toast.success('تم تحديث الملف الشخصي')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header user={user} onNavigate={onNavigate} />
      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4">الملف الشخصي</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> بياناتي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input value={user.email ?? ''} disabled dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم الكامل</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>المستوى الدراسي</Label>
              <Select value={academicLevelId} onValueChange={setAcademicLevelId}>
                <SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>نبذة عني</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة قصيرة عنك..." rows={3} />
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
