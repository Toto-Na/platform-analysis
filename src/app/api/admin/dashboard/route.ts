import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalComparisons,
    approvedComparisons,
    submittedComparisons,
    underReviewComparisons,
    needsRevisionComparisons,
    totalWebsitesStudied,
    recentLogs,
  ] = await Promise.all([
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'STUDENT', isActive: true } }),
    db.user.count({ where: { role: 'STUDENT', isActive: false } }),
    db.comparison.count(),
    db.comparison.count({ where: { status: 'APPROVED' } }),
    db.comparison.count({ where: { status: 'SUBMITTED' } }),
    db.comparison.count({ where: { status: 'UNDER_REVIEW' } }),
    db.comparison.count({ where: { status: 'NEEDS_REVISION' } }),
    db.comparisonWebsite.count(),
    db.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
  ])

  // Recent comparisons
  const recentComparisons = await db.comparison.findMany({
    take: 8,
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { name: true } },
      websites: { select: { name: true } },
    },
  })

  return json({
    stats: {
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalComparisons,
      approvedComparisons,
      submittedComparisons,
      underReviewComparisons,
      needsRevisionComparisons,
      totalWebsitesStudied,
    },
    recentComparisons: recentComparisons.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      studentName: c.student.name,
      websites: c.websites.map((w) => w.name).join('، '),
      updatedAt: c.updatedAt,
    })),
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      action: l.action,
      description: l.description,
      user: l.user?.name ?? null,
      createdAt: l.createdAt,
    })),
  })
}
