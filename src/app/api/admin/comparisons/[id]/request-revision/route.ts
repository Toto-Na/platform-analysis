import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

const Schema = z.object({
  notes: z.string().min(3, 'يرجى كتابة ملاحظات للطالب'),
})

export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({ where: { id } })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)

  await db.$transaction([
    db.comparison.update({ where: { id }, data: { status: 'NEEDS_REVISION' } }),
    db.adminReview.create({
      data: {
        comparisonId: id,
        reviewerId: session.user.id,
        action: 'REQUEST_REVISION',
        notes: parsed.data.notes,
      },
    }),
  ])

  await logAudit({
    userId: session.user.id,
    action: 'COMPARISON_REVISION',
    targetType: 'COMPARISON',
    targetId: id,
    description: `إعادة مقارنة للتعديل: ${comparison.title}`,
  })
  return json({ message: 'تمت إعادة التحليل للطالب للتعديل', status: 'NEEDS_REVISION' })
}
