'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPut } from '@/lib/api'

type Settings = Record<string, string>

const SETTING_GROUPS = [
  {
    title: 'الهوية العامة',
    fields: [
      { key: 'platform_name', label: 'اسم المنصة', type: 'text' },
      { key: 'platform_short_name', label: 'الاسم المختصر', type: 'text' },
    ],
  },
  {
    title: 'إعدادات المقارنة',
    fields: [
      { key: 'min_websites', label: 'الحد الأدنى للمواقع', type: 'number' },
      { key: 'max_websites', label: 'الحد الأقصى للمواقع', type: 'number' },
      { key: 'assignment_type', label: 'طريقة تحديد المواقع', type: 'select', options: [
        { value: 'STUDENT_CHOICE', label: 'الطالب يختار بنفسه' },
        { value: 'FIXED', label: 'الإدارة تحدد المواقع' },
        { value: 'OPTIONAL_ADD', label: 'مواقع أساسية + إضافة من الطالب' },
      ]},
      { key: 'allow_edit_after_submit', label: 'السماح بالتعديل بعد الإرسال', type: 'boolean' },
    ],
  },
  {
    title: 'سياسة النشر',
    fields: [
      { key: 'allow_public_comparisons', label: 'السماح بمشاهدة تحليلات الزملاء', type: 'boolean' },
      { key: 'public_comparisons_policy', label: 'سياسة ظهور التحليلات', type: 'select', options: [
        { value: 'AFTER_SUBMIT', label: 'بعد الإرسال مباشرة' },
        { value: 'AFTER_APPROVED', label: 'بعد الاعتماد فقط' },
        { value: 'HIDDEN', label: 'إخفاء تحليلات الزملاء' },
      ]},
    ],
  },
  {
    title: 'التسجيل والحسابات',
    fields: [
      { key: 'allow_public_registration', label: 'السماح بالتسجيل العام', type: 'boolean' },
      { key: 'require_admin_approval', label: 'اشتراط موافقة الإدارة قبل تفعيل الحساب', type: 'boolean' },
    ],
  },
  {
    title: 'إعدادات العرض',
    fields: [
      { key: 'dark_mode_enabled', label: 'تفعيل الوضع الداكن', type: 'boolean' },
      { key: 'smtp_from', label: 'بريد المرسل', type: 'text' },
    ],
  },
]

export function AdminSettings(_: any) {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGet<{ settings: Settings }>('/api/admin/settings')
      .then((r) => setSettings(r.settings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(key: string, value: any) {
    setSettings((prev) => ({ ...prev, [key]: String(value) }))
  }

  async function save() {
    setSaving(true)
    try {
      await apiPut('/api/admin/settings', { settings })
      toast.success('تم حفظ الإعدادات')
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">إعدادات النظام</h1>
          <p className="text-sm text-muted-foreground mt-1">تحكم كامل في سلوك المنصة دون تعديل الكود</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ الإعدادات
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {SETTING_GROUPS.map((group, i) => (
          <Card key={i}>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-primary" /> {group.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {group.fields.map((f) => {
                const value = settings[f.key] ?? ''
                if (f.type === 'boolean') {
                  return (
                    <div key={f.key} className="flex items-center justify-between gap-3 py-1">
                      <Label className="text-sm">{f.label}</Label>
                      <Switch checked={value === 'true'} onCheckedChange={(v) => update(f.key, v)} />
                    </div>
                  )
                }
                if (f.type === 'select') {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-sm">{f.label}</Label>
                      <Select value={value} onValueChange={(v) => update(f.key, v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {f.options!.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }
                if (f.type === 'number') {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-sm">{f.label}</Label>
                      <Input type="number" value={value} onChange={(e) => update(f.key, e.target.value)} />
                    </div>
                  )
                }
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-sm">{f.label}</Label>
                    <Input value={value} onChange={(e) => update(f.key, e.target.value)} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
