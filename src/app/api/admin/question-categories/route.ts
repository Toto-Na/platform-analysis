import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const cats = await db.questionCategory.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  return json(cats.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    sortOrder: c.sortOrder,
    status: c.status,
    questionsCount: c._count.questions,
    createdAt: c.createdAt,
  })))
}

const Schema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
})

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const exists = await db.questionCategory.findFirst({ where: { name: parsed.data.name } })
  if (exists) return errorJson('القسم موجود', 409)
  const cat = await db.questionCategory.create({ data: parsed.data })
  await logAudit({
    userId: session.user.id,
    action: 'CATEGORY_CREATE',
    targetType: 'CATEGORY',
    targetId: cat.id,
    description: `إضافة قسم: ${cat.name}`,
  })
  return json(cat, 201)
}
