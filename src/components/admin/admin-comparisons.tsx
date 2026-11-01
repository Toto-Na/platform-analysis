'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Loader2 } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { StatusBadge } from '@/components/shared/status-badge'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'

type Comparison = {
  id: string; title: string; status: string; statusLabel: string
  student: { id: string; name: string; email: string; academicLevel: string | null }
  websites: Array<{ id: string; name: string; url: string }>
  websiteCount: number; answersCount: number
  createdAt: string; submittedAt: string | null; updatedAt: string
}

export function AdminComparisons({ onNavigate }: any) {
  const [items, setItems] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    try {
      const r = await apiGet<{ comparisons: Comparison[] }>(`/api/admin/comparisons?${params}`)
      setItems(r.comparisons)
    } catch (e: any) {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search, status])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">إدارة المقارنات</h1>
        <p className="text-sm text-muted-foreground mt-1">{items.length} مقارنة</p>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالعنوان أو اسم الطالب..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="كل الحالات" /></SelectTrigger>
              <SelectContent>
                {Object.entries(COMPARISON_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الطالب</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>المواقع</TableHead>
                  <TableHead className="text-center">الإجابات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد مقارنات</TableCell></TableRow>
                ) : items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.student.name}</TableCell>
                    <TableCell className="text-xs">{c.student.academicLevel ?? '—'}</TableCell>
                    <TableCell className="text-xs">{c.websites.map(w => w.name).join('، ')}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{c.answersCount}</Badge></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('ar') : '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => onNavigate({ view: 'admin', section: 'review', id: c.id })}>
                        <Eye className="h-3.5 w-3.5 ml-1" /> مراجعة
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
