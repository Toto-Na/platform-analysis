import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search') ?? ''

  const where: any = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { student: { name: { contains: search } } },
      { student: { email: { contains: search } } },
    ]
  }

  const comparisons = await db.comparison.findMany({
    where,
    include: {
      student: { include: { studentProfile: { include: { academicLevel: true } } } },
      websites: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { answers: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return json({
    comparisons: comparisons.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      statusLabel: COMPARISON_STATUS_LABELS[c.status as keyof typeof COMPARISON_STATUS_LABELS] ?? c.status,
      student: {
        id: c.student.id,
        name: c.student.name,
        email: c.student.email,
        academicLevel: c.student.studentProfile?.academicLevel?.name ?? null,
      },
      websites: c.websites.map((w) => ({ id: w.id, name: w.name, url: w.url })),
      websiteCount: c.websites.length,
      answersCount: c._count.answers,
      createdAt: c.createdAt,
      submittedAt: c.submittedAt,
      updatedAt: c.updatedAt,
    })),
  })
}
