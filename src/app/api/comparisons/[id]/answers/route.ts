import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

// Save (upsert) one or more answers. Body:
// { answers: [{ websiteId, questionVersionId, value }] }
const SaveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      websiteId: z.string(),
      questionVersionId: z.string(),
      value: z.string(),
    }),
  ),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({ where: { id } })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  if (comparison.studentId !== session.user.id) {
    return errorJson('لا تملك صلاحية تعديل هذه المقارنة', 403)
  }
  if (!['DRAFT', 'COMPLETED', 'NEEDS_REVISION'].includes(comparison.status)) {
    return errorJson('لا يمكن تعديل إجابات هذه المقارنة في حالتها الحالية', 422)
  }

  const body = await readJson(req)
  const parsed = SaveAnswersSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)

  // Validate website & question version belong to this comparison
  const comparisonWebsites = await db.comparisonWebsite.findMany({
    where: { comparisonId: id },
    select: { id: true },
  })
  const websiteIds = new Set(comparisonWebsites.map((w) => w.id))
  for (const a of parsed.data.answers) {
    if (!websiteIds.has(a.websiteId)) {
      return errorJson(`الموقع غير تابع لهذه المقارنة: ${a.websiteId}`, 422)
    }
  }

  // Upsert each answer in a transaction
  await db.$transaction(
    parsed.data.answers.map((a) =>
      db.answer.upsert({
        where: {
          comparisonId_websiteId_questionVersionId: {
            comparisonId: id,
            websiteId: a.websiteId,
            questionVersionId: a.questionVersionId,
          },
        },
        create: {
          comparisonId: id,
          websiteId: a.websiteId,
          questionVersionId: a.questionVersionId,
          value: a.value,
        },
        update: { value: a.value },
      }),
    ),
  )

  // Touch comparison updatedAt
  await db.comparison.update({ where: { id }, data: { updatedAt: new Date() } })

  return json({ saved: parsed.data.answers.length, savedAt: new Date() })
}

// Get all answers for the comparison
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth('ANY')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({
    where: { id },
    include: { answers: true },
  })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  if (session.user.role === 'STUDENT' && comparison.studentId !== session.user.id) {
    // Allow read for public comparisons only
    const allowSetting = await db.systemSetting.findUnique({ where: { key: 'allow_public_comparisons' } })
    if (allowSetting?.value === 'false' || comparison.status !== 'APPROVED') {
      return errorJson('لا تملك صلاحية الوصول', 403)
    }
  }
  return json({
    answers: comparison.answers.map((a) => ({
      id: a.id,
      websiteId: a.websiteId,
      questionVersionId: a.questionVersionId,
      value: a.value,
      updatedAt: a.updatedAt,
    })),
  })
}
