import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

const Schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  status: z.enum(['ACTIVE','ARCHIVED']).optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const body = await readJson(req)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const cat = await db.questionCategory.update({ where: { id }, data: parsed.data })
  await logAudit({
    userId: session.user.id,
    action: 'CATEGORY_UPDATE',
    targetType: 'CATEGORY',
    targetId: id,
    description: `تعديل قسم: ${cat.name}`,
  })
  return json(cat)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const cat = await db.questionCategory.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } })
  if (!cat) return errorJson('القسم غير موجود', 404)
  if (cat._count.questions > 0) {
    // Archive instead of delete
    await db.questionCategory.update({ where: { id }, data: { status: 'ARCHIVED' } })
    return json({ message: 'تمت أرشفة القسم لأنه يحتوي على أسئلة' })
  }
  await db.questionCategory.delete({ where: { id } })
  await logAudit({
    userId: session.user.id,
    action: 'CATEGORY_DELETE',
    targetType: 'CATEGORY',
    targetId: id,
    description: `حذف قسم: ${cat.name}`,
  })
  return json({ message: 'تم حذف القسم' })
}
