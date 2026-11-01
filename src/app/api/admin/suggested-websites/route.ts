import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const sites = await db.suggestedWebsite.findMany({ orderBy: { name: 'asc' } })
  return json(sites)
}

const Schema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const exists = await db.suggestedWebsite.findUnique({ where: { url: parsed.data.url } })
  if (exists) return errorJson('الموقع موجود', 409)
  const site = await db.suggestedWebsite.create({ data: parsed.data })
  return json(site, 201)
}
