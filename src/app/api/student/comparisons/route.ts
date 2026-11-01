import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'

export async function GET() {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const comparisons = await db.comparison.findMany({
    where: { studentId: session.user.id },
    include: { websites: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
  return json({
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
