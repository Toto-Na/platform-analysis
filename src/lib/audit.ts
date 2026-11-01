import { db } from '@/lib/db'

type AuditArgs = {
  userId?: string | null
  action: string
  targetType?: string
  targetId?: string
  description?: string
  ipAddress?: string | null
}

export async function logAudit({ userId, action, targetType, targetId, description, ipAddress }: AuditArgs) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        description: description ?? null,
        ipAddress: ipAddress ?? null,
      },
    })
  } catch (err) {
    // Never let audit logging fail a request
    console.error('[audit] failed to log', action, err)
  }
}
