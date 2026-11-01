import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'

interface Params { params: Promise<{ id: string }> }

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const body = await readJson(req)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const lvl = await db.academicLevel.update({ where: { id }, data: parsed.data })
  return json(lvl)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  // Check for linked students
  const count = await db.studentProfile.count({ where: { academicLevelId: id } })
  if (count > 0) {
    return errorJson('لا يمكن حذف مستوى مرتبط بطلاب', 422)
  }
  await db.academicLevel.delete({ where: { id } })
  return json({ message: 'تم حذف المستوى' })
}
