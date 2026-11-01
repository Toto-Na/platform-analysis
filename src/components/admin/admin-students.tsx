'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Search, Plus, Pencil, Power, KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPut } from '@/lib/api'

type Student = {
  id: string; name: string; email: string; isActive: boolean
  academicLevel: { id: string; name: string } | null
  comparisonsCount: number; createdAt: string; lastLoginAt: string | null
}

export function AdminStudents({ onNavigate }: any) {
  const [students, setStudents] = useState<Student[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelId, setLevelId] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Student | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (levelId) params.set('levelId', levelId)
    if (status) params.set('status', status)
    try {
      const [s, l] = await Promise.all([
        apiGet<{ students: Student[] }>(`/api/admin/students?${params}`),
        apiGet<any[]>('/api/admin/academic-levels'),
      ])
      setStudents(s.students)
      setLevels(l)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, levelId, status])

  async function toggleActive(s: Student) {
    try {
      await apiPut(`/api/admin/students/${s.id}`, { isActive: !s.isActive })
      toast.success(s.isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب')
      load()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">إدارة الطلاب</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length} طالب</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 ml-2" /> إضافة طالب
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
            </div>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger><SelectValue placeholder="كل المستويات" /></SelectTrigger>
              <SelectContent>
                {levels.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="كل الحالات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">معطل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead className="text-center">المقارنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد طلاب</TableCell></TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs" dir="ltr">{s.email}</TableCell>
                      <TableCell>{s.academicLevel?.name ?? '—'}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{s.comparisonsCount}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? 'default' : 'destructive'} className="text-xs">
                          {s.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('ar')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(s)} title={s.isActive ? 'تعطيل' : 'تفعيل'}>
                            <Power className={`h-3.5 w-3.5 ${s.isActive ? 'text-emerald-600' : 'text-rose-600'}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {(editing || creating) && (
        <StudentDialog
          student={editing}
          levels={levels}
          onClose={() => { setEditing(null); setCreating(false) }}
          onSaved={() => { setEditing(null); setCreating(false); load() }}
        />
      )}
    </div>
  )
}

function StudentDialog({ student, levels, onClose, onSaved }: any) {
  const [name, setName] = useState(student?.name ?? '')
  const [email, setEmail] = useState(student?.email ?? '')
  const [academicLevelId, setAcademicLevelId] = useState(student?.academicLevel?.id ?? '')
  const [isActive, setIsActive] = useState(student?.isActive ?? true)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      if (student) {
        await apiPut(`/api/admin/students/${student.id}`, {
          name, email, academicLevelId: academicLevelId || null, isActive,
          ...(newPassword ? { resetPassword: newPassword } : {}),
        })
        toast.success('تم تحديث بيانات الطالب')
      } else {
        if (!newPassword || newPassword.length < 8) { toast.error('كلمة المرور مطلوبة (8 أحرف على الأقل)'); setSaving(false); return }
        await apiPost('/api/admin/students', {
          name, email, password: newPassword, academicLevelId: academicLevelId || null, isActive,
        })
        toast.success('تم إنشاء الطالب بنجاح')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.message)
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{student ? 'تعديل طالب' : 'إضافة طالب جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>الاسم</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>البريد الإلكتروني</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>المستوى الدراسي</Label>
            <Select value={academicLevelId} onValueChange={setAcademicLevelId}>
              <SelectTrigger><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
              <SelectContent>
                {levels.map((l: any) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5" />
              {student ? 'إعادة تعيين كلمة المرور (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}
            </Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {student && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              الحساب نشط
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
