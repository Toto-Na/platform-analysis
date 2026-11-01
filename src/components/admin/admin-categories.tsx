'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

type Category = {
  id: string; name: string; description: string | null
  sortOrder: number; status: string; questionsCount: number
}

export function AdminCategories(_: any) {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try { setItems(await apiGet<Category[]>('/api/admin/question-categories')) } catch (e: any) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function reorder(c: Category, dir: -1 | 1) {
    const idx = items.indexOf(c)
    const target = items[idx + dir]
    if (!target) return
    await Promise.all([
      apiPut(`/api/admin/question-categories/${c.id}`, { sortOrder: target.sortOrder }),
      apiPut(`/api/admin/question-categories/${target.id}`, { sortOrder: c.sortOrder }),
    ])
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">أقسام الأسئلة</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} قسم</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 ml-2" /> إضافة قسم</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">الترتيب</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="text-center">الأسئلة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><FolderTree className="h-8 w-8 mx-auto mb-2 opacity-40" />لا توجد أقسام</TableCell></TableRow>
              ) : items.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={i === 0} onClick={() => reorder(c, -1)}><ArrowUp className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={i === items.length - 1} onClick={() => reorder(c, 1)}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description ?? '—'}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{c.questionsCount}</Badge></TableCell>
                  <TableCell><Badge variant={c.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">{c.status === 'ACTIVE' ? 'نشط' : 'مؤرشف'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (confirm(c.questionsCount > 0 ? 'هذا القسم يحتوي على أسئلة وسيتم أرشفه بدل الحذف. متابعة؟' : 'حذف هذا القسم؟')) { try { await apiDelete(`/api/admin/question-categories/${c.id}`); toast.success('تم'); load() } catch (e: any) { toast.error(e.message) } } }}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {(editing || creating) && (
        <CategoryDialog category={editing} onClose={() => { setEditing(null); setCreating(false) }} onSaved={() => { setEditing(null); setCreating(false); load() }} />
      )}
    </div>
  )
}

function CategoryDialog({ category, onClose, onSaved }: any) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      if (category) { await apiPut(`/api/admin/question-categories/${category.id}`, { name, description: description || null }); toast.success('تم التحديث') }
      else { await apiPost('/api/admin/question-categories', { name, description: description || null, sortOrder: 99 }); toast.success('تمت الإضافة') }
      onSaved()
    } catch (e: any) { toast.error(e.message); setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{category ? 'تعديل قسم' : 'إضافة قسم'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>الاسم</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
