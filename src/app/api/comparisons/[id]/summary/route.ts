import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth('ANY')
  if (error) return error
  const { id } = await params

  const comparison = await db.comparison.findUnique({
    where: { id },
    include: {
      websites: { orderBy: { sortOrder: 'asc' } },
      answers: true,
      summary: true,
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

  if (session.user.role === 'STUDENT' && comparison.studentId !== session.user.id) {
    const allowSetting = await db.systemSetting.findUnique({ where: { key: 'allow_public_comparisons' } })
    if (allowSetting?.value === 'false' || comparison.status !== 'APPROVED') {
      return errorJson('لا تملك صلاحية الوصول', 403)
    }
  }

  // Build a structured summary: for each question, list answers per website
  const questionsWithAnswers = (comparison.questionSetVersion?.items ?? []).map((item) => {
    const qv = item.questionVersion
    const answersByWebsite: Record<string, string> = {}
    for (const w of comparison.websites) {
      const ans = comparison.answers.find(
        (a) => a.websiteId === w.id && a.questionVersionId === qv.id,
      )
      answersByWebsite[w.id] = ans?.value ?? ''
    }
    return {
      questionVersionId: qv.id,
      text: qv.snapshotText,
      description: qv.snapshotDescription,
      answerType: qv.snapshotAnswerType,
      isRequired: item.isRequired,
      sortOrder: item.sortOrder,
      options: JSON.parse(qv.snapshotOptions || '[]'),
      category: qv.question.category
        ? { id: qv.question.category.id, name: qv.question.category.name }
        : null,
      answersByWebsite,
    }
  })

  // Group by category
  const byCategory = new Map<string, any>()
  for (const q of questionsWithAnswers) {
    const catId = q.category?.id ?? 'uncategorized'
    if (!byCategory.has(catId)) {
      byCategory.set(catId, {
        category: q.category,
        questions: [],
      })
    }
    byCategory.get(catId)!.questions.push(q)
  }

  return json({
    id: comparison.id,
    title: comparison.title,
    status: comparison.status,
    websites: comparison.websites.map((w) => ({ id: w.id, name: w.name, url: w.url })),
    groupedQuestions: Array.from(byCategory.values()),
    summary: comparison.summary,
    finalOpinion: comparison.finalOpinion ? JSON.parse(comparison.finalOpinion) : null,
  })
}
