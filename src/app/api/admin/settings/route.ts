import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const settings = await db.systemSetting.findMany({ orderBy: { key: 'asc' } })
  // Return as a key-value object for convenience
  const obj: Record<string, string> = {}
  for (const s of settings) obj[s.key] = s.value
  return json({ settings: obj, raw: settings })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  // Expect { settings: { key: value, ... } }
  const updates: Record<string, string> = body.settings ?? body
  for (const [key, value] of Object.entries(updates)) {
    const exists = await db.systemSetting.findUnique({ where: { key } })
    if (exists) {
      await db.systemSetting.update({ where: { key }, data: { value: String(value) } })
    } else {
      await db.systemSetting.create({ data: { key, value: String(value) } })
    }
  }
  return json({ message: 'تم تحديث الإعدادات', updated: Object.keys(updates).length })
}
