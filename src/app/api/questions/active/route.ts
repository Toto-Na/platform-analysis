import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

// Returns the currently published question set (with snapshots) for student use.
export async function GET() {
  const { error } = await requireAuth('STUDENT')
  if (error) return error

  const setVersion = await db.questionSetVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
    include: {
      items: {
        include: { questionVersion: { include: { question: { include: { category: true } } } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!setVersion) return json({ setVersion: null, questions: [], categories: [] })

  const categories = new Map<string, any>()
  for (const item of setVersion.items) {
    const cat = item.questionVersion.question.category
    if (cat && !categories.has(cat.id)) {
      categories.set(cat.id, { id: cat.id, name: cat.name, description: cat.description, sortOrder: cat.sortOrder })
    }
  }

  return json({
    setVersion: {
      id: setVersion.id,
      versionNumber: setVersion.versionNumber,
      publishedAt: setVersion.publishedAt,
    },
    categories: Array.from(categories.values()).sort((a, b) => a.sortOrder - b.sortOrder),
    questions: setVersion.items.map((item) => ({
      questionVersionId: item.questionVersionId,
      sortOrder: item.sortOrder,
      isRequired: item.isRequired,
      text: item.questionVersion.snapshotText,
      description: item.questionVersion.snapshotDescription,
      answerType: item.questionVersion.snapshotAnswerType,
      options: JSON.parse(item.questionVersion.snapshotOptions || '[]'),
      category: item.questionVersion.question.category
        ? { id: item.questionVersion.question.category.id, name: item.questionVersion.question.category.name }
        : null,
    })),
  })
}
