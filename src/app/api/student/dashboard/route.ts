import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'

export async function GET() {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const studentId = session.user.id

  const [comparisons, counts] = await Promise.all([
    db.comparison.findMany({
      where: { studentId },
      include: {
        websites: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.comparison.groupBy({
      by: ['status'],
      where: { studentId },
      _count: { _all: true },
    }),
  ])

  const stats = {
    total: comparisons.length,
    draft: 0,
    completed: 0,
    submitted: 0,
    underReview: 0,
    needsRevision: 0,
    approved: 0,
  }
  for (const c of counts) {
    const key = c.status.toLowerCase().replace(/_/g, '')
    const camelKey = key.replace(/(\w)(\w*)/, (_, a, b) => a.toUpperCase() + b)
    if (camelKey in stats) (stats as any)[camelKey] = c._count._all
  }

  return json({
    student: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      academicLevelName: session.user.academicLevelName,
    },
    stats,
    comparisons: comparisons.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      statusLabel: COMPARISON_STATUS_LABELS[c.status as keyof typeof COMPARISON_STATUS_LABELS] ?? c.status,
      websites: c.websites.map((w) => ({ id: w.id, name: w.name, url: w.url })),
      websiteCount: c.websites.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      submittedAt: c.submittedAt,
    })),
  })
}
