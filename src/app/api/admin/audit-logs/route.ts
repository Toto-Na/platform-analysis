import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const take = parseInt(url.searchParams.get('limit') ?? '100', 10)

  const where: any = {}
  if (action) where.action = action

  const logs = await db.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: Math.min(take, 500),
  })

  return json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      description: l.description,
      user: l.user ? { name: l.user.name, email: l.user.email, role: l.user.role } : null,
      createdAt: l.createdAt,
    })),
  })
}
