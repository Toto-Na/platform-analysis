import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      studentProfile: { include: { academicLevel: true } },
      _count: { select: { comparisons: true } },
      comparisons: { where: { status: 'APPROVED' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      academicLevel: s.studentProfile?.academicLevel?.name ?? null,
      totalComparisons: s._count.comparisons,
      approvedComparisons: s.comparisons.length,
      createdAt: s.createdAt,
      lastLoginAt: s.lastLoginAt,
    })),
  })
}
