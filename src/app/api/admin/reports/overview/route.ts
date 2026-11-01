import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  // Comparisons by academic level
  const byLevel = await db.comparison.findMany({
    where: { student: { role: 'STUDENT' } },
    include: {
      student: { include: { studentProfile: { include: { academicLevel: true } } } },
    },
  })
  const levelMap = new Map<string, { name: string; count: number }>()
  for (const c of byLevel) {
    const lvl = c.student.studentProfile?.academicLevel?.name ?? 'بدون مستوى'
    if (!levelMap.has(lvl)) levelMap.set(lvl, { name: lvl, count: 0 })
    levelMap.get(lvl)!.count++
  }
  const comparisonsByLevel = Array.from(levelMap.values()).sort((a, b) => b.count - a.count)

  // Comparisons by status
  const statusCounts = await db.comparison.groupBy({ by: ['status'], _count: { _all: true } })

  // Status trend over last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentComparisons = await db.comparison.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { status: true, createdAt: true },
  })
  const monthMap = new Map<string, string>()
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(key)
  }
  const trend: Record<string, number> = {}
  for (const m of months) trend[m] = 0
  for (const c of recentComparisons) {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (key in trend) trend[key]++
  }

  return json({
    comparisonsByLevel,
    statusDistribution: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
    monthlyTrend: months.map((m) => ({ month: m, count: trend[m] })),
    totalComparisons: byLevel.length,
    totalStudents: await db.user.count({ where: { role: 'STUDENT' } }),
    totalApproved: statusCounts.find((s) => s.status === 'APPROVED')?._count._all ?? 0,
  })
}
