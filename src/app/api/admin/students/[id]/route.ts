import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

const UpdateStudentSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  academicLevelId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  resetPassword: z.string().min(8).optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const student = await db.user.findUnique({
    where: { id },
    include: { studentProfile: true },
  })
  if (!student || student.role !== 'STUDENT') return errorJson('الطالب غير موجود', 404)

  const body = await readJson(req)
  const parsed = UpdateStudentSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const { name, email, academicLevelId, isActive, resetPassword } = parsed.data

  if (email && email.toLowerCase() !== student.email) {
    const exists = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) return errorJson('البريد مستخدم', 409)
  }

  const data: any = {}
  if (name) data.name = name
  if (email) data.email = email.toLowerCase()
  if (typeof isActive === 'boolean') data.isActive = isActive

  if (resetPassword) {
    data.passwordHash = await bcrypt.hash(resetPassword, 12)
  }

  await db.user.update({ where: { id }, data })

  if (academicLevelId !== undefined) {
    if (student.studentProfile) {
      await db.studentProfile.update({
        where: { userId: id },
        data: { academicLevelId: academicLevelId || null },
      })
    } else {
      await db.studentProfile.create({
        data: { userId: id, academicLevelId: academicLevelId || null },
      })
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'STUDENT_UPDATE',
    targetType: 'USER',
    targetId: id,
    description: `تعديل بيانات الطالب: ${student.email}`,
  })

  return json({ message: 'تم تحديث بيانات الطالب' })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const student = await db.user.findUnique({ where: { id } })
  if (!student || student.role !== 'STUDENT') return errorJson('الطالب غير موجود', 404)
  // Soft-delete: just deactivate
  await db.user.update({ where: { id }, data: { isActive: false } })
  await logAudit({
    userId: session.user.id,
    action: 'STUDENT_DISABLE',
    targetType: 'USER',
    targetId: id,
    description: `تعطيل الطالب: ${student.email}`,
  })
  return json({ message: 'تم تعطيل حساب الطالب' })
}
