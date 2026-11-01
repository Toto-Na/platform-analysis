'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

type Level = { id: string; name: string; description: string | null; sortOrder: number; isActive: boolean }

export function AdminLevels(_: any) {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Level | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await apiGet<Level[]>('/api/admin/academic-levels')
      setLevels(data)
    } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function reorder(l: Level, dir: -1 | 1) {
    const idx = levels.indexOf(l)
    const target = levels[idx + dir]
    if (!target) return
    await Promise.all([
      apiPut(`/api/admin/academic-levels/${l.id}`, { sortOrder: target.sortOrder }),
      apiPut(`/api/admin/academic-levels/${target.id}`, { sortOrder: l.sortOrder }),
    ])
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المستويات الدراسية</h1>
          <p className="text-sm text-muted-foreground mt-1">{levels.length} مستوى</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 ml-2" /> إضافة مستوى</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الترتيب</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : levels.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مستويات</TableCell></TableRow>
              ) : (
                levels.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={i === 0} onClick={() => reorder(l, -1)}><ArrowUp className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={i === levels.length - 1} onClick={() => reorder(l, 1)}><ArrowDown className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.description ?? '—'}</TableCell>
                    <TableCell><Badge variant={l.isActive ? 'default' : 'destructive'} className="text-xs">{l.isActive ? 'نشط' : 'معطل'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={async () => { if (confirm('حذف هذا المستوى؟')) { try { await apiDelete(`/api/admin/academic-levels/${l.id}`); toast.success('تم الحذف'); load() } catch (e: any) { toast.error(e.message) } } }}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {(editing || creating) && (
        <LevelDialog level={editing} onClose={() => { setEditing(null); setCreating(false) }} onSaved={() => { setEditing(null); setCreating(false); load() }} />
      )}
    </div>
  )
}

function LevelDialog({ level, onClose, onSaved }: any) {
  const [name, setName] = useState(level?.name ?? '')
  const [description, setDescription] = useState(level?.description ?? '')
  const [isActive, setIsActive] = useState(level?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      if (level) {
        await apiPut(`/api/admin/academic-levels/${level.id}`, { name, description: description || null, isActive })
        toast.success('تم تحديث المستوى')
      } else {
        await apiPost('/api/admin/academic-levels', { name, description: description || null, sortOrder: 99, isActive })
        toast.success('تم إضافة المستوى')
      }
      onSaved()
    } catch (err: any) { toast.error(err.message); setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{level ? 'تعديل مستوى' : 'إضافة مستوى'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>الاسم</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>الوصف</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> نشط</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
