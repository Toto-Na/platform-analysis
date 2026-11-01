import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const q = await db.question.findUnique({ where: { id } })
  if (!q) return errorJson('السؤال غير موجود', 404)
  await db.question.update({ where: { id }, data: { status: 'ACTIVE' } })
  return json({ message: 'تم تفعيل السؤال' })
}
