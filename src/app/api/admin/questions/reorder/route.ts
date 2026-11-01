import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

const Schema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
  })),
})

export async function POST(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  await db.$transaction(
    parsed.data.items.map((it) =>
      db.question.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } }),
    ),
  )
  return json({ message: 'تم تحديث ترتيب الأسئلة' })
}
