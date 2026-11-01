import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

const SubmitSchema = z.object({
  finalOpinion: z.object({
    bestWebsiteId: z.string().optional().nullable(),
    bestWebsiteName: z.string().optional().nullable(),
    reason: z.string().min(10, 'يرجى توضيح سبب اختيار الموقع الأفضل'),
    lessonLearned: z.string().min(10, 'يرجى كتابة أهم ما تعلمته'),
  }),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const { id } = await params

  const comparison = await db.comparison.findUnique({
    where: { id },
    include: {
      websites: true,
      answers: true,
      questionSetVersion: {
        include: { items: true },
      },
    },
  })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  if (comparison.studentId !== session.user.id) {
    return errorJson('لا تملك صلاحية إرسال هذه المقارنة', 403)
  }
  if (!['DRAFT', 'COMPLETED', 'NEEDS_REVISION'].includes(comparison.status)) {
    return errorJson('تم إرسال هذه المقارنة مسبقًا', 422)
  }

  const body = await readJson(req)
  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)

  // Verify required questions answered for every website
  const requiredItems = comparison.questionSetVersion?.items.filter((i) => i.isRequired) ?? []
  const answersByWebsite = new Map<string, Set<string>>()
  for (const a of comparison.answers) {
    if (!answersByWebsite.has(a.websiteId)) answersByWebsite.set(a.websiteId, new Set())
    if (a.value && a.value.trim().length > 0) {
      answersByWebsite.get(a.websiteId)!.add(a.questionVersionId)
    }
  }
  for (const w of comparison.websites) {
    const answered = answersByWebsite.get(w.id) ?? new Set<string>()
    for (const req of requiredItems) {
      if (!answered.has(req.questionVersionId)) {
        return errorJson(`لم يتم الإجابة عن سؤال إلزامي في موقع: ${w.name}`, 422)
      }
    }
  }

  // Submit in a transaction
  await db.$transaction(async (tx) => {
    // Save summary
    if (comparison.summary) {
      await tx.comparisonSummary.update({
        where: { comparisonId: id },
        data: {
          bestWebsiteId: parsed.data.finalOpinion.bestWebsiteId,
          bestWebsiteName: parsed.data.finalOpinion.bestWebsiteName,
          reason: parsed.data.finalOpinion.reason,
          lessonLearned: parsed.data.finalOpinion.lessonLearned,
        },
      })
    } else {
      await tx.comparisonSummary.create({
        data: {
          comparisonId: id,
          bestWebsiteId: parsed.data.finalOpinion.bestWebsiteId,
          bestWebsiteName: parsed.data.finalOpinion.bestWebsiteName,
          reason: parsed.data.finalOpinion.reason,
          lessonLearned: parsed.data.finalOpinion.lessonLearned,
        },
      })
    }
    // Update comparison status & final opinion JSON
    await tx.comparison.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        finalOpinion: JSON.stringify(parsed.data.finalOpinion),
      },
    })
  })

  await logAudit({
    userId: session.user.id,
    action: 'COMPARISON_SUBMIT',
    targetType: 'COMPARISON',
    targetId: id,
    description: `إرسال مقارنة: ${comparison.title}`,
  })

  return json({ message: 'تم إرسال التحليل إلى الإدارة بنجاح', status: 'SUBMITTED' })
}
