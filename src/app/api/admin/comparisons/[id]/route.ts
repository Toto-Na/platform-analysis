import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({
    where: { id },
    include: {
      student: { include: { studentProfile: { include: { academicLevel: true } } } },
      websites: { orderBy: { sortOrder: 'asc' } },
      answers: true,
      summary: true,
      reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      questionSetVersion: {
        include: {
          items: {
            include: { questionVersion: { include: { question: { include: { category: true } } } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  return json({
    ...comparison,
    questions: comparison.questionSetVersion?.items.map((it) => ({
      questionVersionId: it.questionVersionId,
      sortOrder: it.sortOrder,
      isRequired: it.isRequired,
      text: it.questionVersion.snapshotText,
      description: it.questionVersion.snapshotDescription,
      answerType: it.questionVersion.snapshotAnswerType,
      options: JSON.parse(it.questionVersion.snapshotOptions || '[]'),
      category: it.questionVersion.question.category
        ? { id: it.questionVersion.question.category.id, name: it.questionVersion.question.category.name }
        : null,
    })),
  })
}
