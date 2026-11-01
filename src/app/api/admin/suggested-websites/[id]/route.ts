import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

interface Params { params: Promise<{ id: string }> }

const Schema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url().optional(),
  description: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const site = await db.suggestedWebsite.update({ where: { id }, data: parsed.data })
  return json(site)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  await db.suggestedWebsite.delete({ where: { id } })
  return json({ message: 'تم حذف الموقع' })
}
