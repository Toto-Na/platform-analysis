import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

const ResetSchema = z.object({
  token: z.string().min(10, 'رمز الاستعادة غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
})

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const parsed = ResetSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  }
  const { token, password, confirmPassword } = parsed.data
  if (password !== confirmPassword) {
    return errorJson('كلمتا المرور غير متطابقتين', 422)
  }
  const record = await db.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return errorJson('رمز الاستعادة غير صالح أو منتهي الصلاحية', 410)
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ])
  await logAudit({
    userId: record.userId,
    action: 'PASSWORD_RESET',
    targetType: 'USER',
    targetId: record.userId,
    description: 'إعادة تعيين كلمة المرور عبر البريد',
  })
  return json({ message: 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك تسجيل الدخول' })
}
