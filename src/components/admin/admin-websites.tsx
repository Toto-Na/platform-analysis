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
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

type Site = { id: string; name: string; url: string; description: string | null; businessType: string | null; isActive: boolean }

export function AdminWebsites(_: any) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Site | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try { setSites(await apiGet<Site[]>('/api/admin/suggested-websites')) } catch (e: any) { toast.error(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المواقع المقترحة</h1>
          <p className="text-sm text-muted-foreground mt-1">{sites.length} موقع</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 ml-2" /> إضافة موقع</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموقع</TableHead>
                <TableHead>الرابط</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : sites.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مواقع</TableCell></TableRow>
              ) : sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1" dir="ltr"><ExternalLink className="h-3 w-3" /> {s.url}</a></TableCell>
                  <TableCell>{s.businessType ?? '—'}</TableCell>
                  <TableCell><Badge variant={s.isActive ? 'default' : 'destructive'} className="text-xs">{s.isActive ? 'نشط' : 'معطل'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (confirm('حذف هذا الموقع؟')) { try { await apiDelete(`/api/admin/suggested-websites/${s.id}`); toast.success('تم الحذف'); load() } catch (e: any) { toast.error(e.message) } } }}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {(editing || creating) && (
        <SiteDialog site={editing} onClose={() => { setEditing(null); setCreating(false) }} onSaved={() => { setEditing(null); setCreating(false); load() }} />
      )}
    </div>
  )
}

function SiteDialog({ site, onClose, onSaved }: any) {
  const [name, setName] = useState(site?.name ?? '')
  const [url, setUrl] = useState(site?.url ?? '')
  const [description, setDescription] = useState(site?.description ?? '')
  const [businessType, setBusinessType] = useState(site?.businessType ?? '')
  const [isActive, setIsActive] = useState(site?.isActive ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const data = { name, url, description: description || null, businessType: businessType || null, isActive }
      if (site) { await apiPut(`/api/admin/suggested-websites/${site.id}`, data); toast.success('تم التحديث') }
      else { await apiPost('/api/admin/suggested-websites', data); toast.success('تمت الإضافة') }
      onSaved()
    } catch (e: any) { toast.error(e.message); setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{site ? 'تعديل موقع' : 'إضافة موقع'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>اسم الموقع</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>الرابط</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" placeholder="https://..." /></div>
          <div className="space-y-1"><Label>نوع النشاط</Label><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="B2C، متجر ملابس..." /></div>
          <div className="space-y-1"><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
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
