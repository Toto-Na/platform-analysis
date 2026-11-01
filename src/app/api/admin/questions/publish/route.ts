import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

const PublishSchema = z.object({
  label: z.string().optional(),
})

// Publishes a NEW question set version: snapshots all active questions,
// links them as items in a new QuestionSetVersion. Existing comparisons
// keep their old set version — new comparisons will use this one.
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = PublishSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)

  const activeQuestions = await db.question.findMany({
    where: { status: 'ACTIVE' },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  if (activeQuestions.length === 0) {
    return errorJson('لا توجد أسئلة نشطة لنشرها', 422)
  }

  const maxVersion = await db.questionSetVersion.aggregate({ _max: { versionNumber: true } })
  const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1

  const newSet = await db.$transaction(async (tx) => {
    const set = await tx.questionSetVersion.create({
      data: {
        versionNumber,
        label: parsed.data.label ?? `الإصدار ${versionNumber}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    for (const q of activeQuestions) {
      // Check if a snapshot already exists for this question + version number
      let qv = await tx.questionVersion.findUnique({
        where: { questionId_versionNumber: { questionId: q.id, versionNumber: q.currentVersionNumber } },
      })
      if (!qv) {
        qv = await tx.questionVersion.create({
          data: {
            questionId: q.id,
            versionNumber: q.currentVersionNumber,
            snapshotText: q.text,
            snapshotDescription: q.description,
            snapshotAnswerType: q.answerType,
            snapshotIsRequired: q.isRequired,
            snapshotOptions: JSON.stringify(q.options.map((o) => ({ text: o.text, value: o.value }))),
          },
        })
      }
      await tx.questionSetVersionItem.create({
        data: {
          setVersionId: set.id,
          questionVersionId: qv.id,
          sortOrder: q.sortOrder,
          isRequired: q.isRequired,
        },
      })
    }
    return set
  })

  await logAudit({
    userId: session.user.id,
    action: 'QUESTION_SET_PUBLISH',
    targetType: 'QUESTION_SET',
    targetId: newSet.id,
    description: `نشر إصدار مجموعة أسئلة جديد v${versionNumber}`,
  })

  return json({ message: 'تم نشر إصدار جديد من مجموعة الأسئلة', versionNumber, setId: newSet.id })
}
