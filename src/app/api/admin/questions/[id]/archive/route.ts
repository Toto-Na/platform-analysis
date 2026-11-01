import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const q = await db.question.findUnique({ where: { id } })
  if (!q) return errorJson('السؤال غير موجود', 404)
  await db.question.update({ where: { id }, data: { status: 'ARCHIVED' } })
  await logAudit({
    userId: session.user.id,
    action: 'QUESTION_ARCHIVE',
    targetType: 'QUESTION',
    targetId: id,
    description: `أرشفة سؤال: ${q.text.slice(0, 60)}`,
  })
  return json({ message: 'تمت أرشفة السؤال' })
}
