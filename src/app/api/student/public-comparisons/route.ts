import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'

export async function GET() {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error

  // Check public comparisons policy
  const policySetting = await db.systemSetting.findUnique({ where: { key: 'public_comparisons_policy' } })
  const policy = policySetting?.value ?? 'AFTER_APPROVED'
  const allowSetting = await db.systemSetting.findUnique({ where: { key: 'allow_public_comparisons' } })
  if (allowSetting?.value === 'false') {
    return json({ comparisons: [], policy: 'HIDDEN' })
  }

  // Status filter based on policy
  const statusFilter =
    policy === 'AFTER_SUBMIT'
      ? ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_REVISION']
      : policy === 'AFTER_APPROVED'
        ? ['APPROVED']
        : ['APPROVED']

  const comparisons = await db.comparison.findMany({
    where: {
      studentId: { not: session.user.id },
      status: { in: statusFilter },
    },
    include: {
      student: { include: { studentProfile: { include: { academicLevel: true } } } },
      websites: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  })

  return json({
    policy,
    comparisons: comparisons.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      statusLabel: COMPARISON_STATUS_LABELS[c.status as keyof typeof COMPARISON_STATUS_LABELS] ?? c.status,
      student: {
        name: c.student.name,
        academicLevel: c.student.studentProfile?.academicLevel?.name ?? null,
      },
      websites: c.websites.map((w) => ({ id: w.id, name: w.name, url: w.url })),
      submittedAt: c.submittedAt,
    })),
  })
}
