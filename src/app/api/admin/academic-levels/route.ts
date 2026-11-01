import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const levels = await db.academicLevel.findMany({ orderBy: { sortOrder: 'asc' } })
  return json(levels)
}

const LevelSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = LevelSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const exists = await db.academicLevel.findFirst({ where: { name: parsed.data.name } })
  if (exists) return errorJson('المستوى موجود', 409)
  const lvl = await db.academicLevel.create({ data: parsed.data })
  return json(lvl, 201)
}
