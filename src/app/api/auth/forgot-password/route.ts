import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { json, errorJson, readJson } from '@/lib/api-auth'

const ForgotSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
})

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const parsed = ForgotSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  }
  const email = parsed.data.email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email } })
  // Always return success to avoid email enumeration
  if (!user) {
    return json({
      message: 'إذا كان البريد الإلكتروني مسجلًا، فسيتم إرسال رابط استعادة كلمة المرور',
      // In demo mode, we don't actually send emails
    })
  }
  // Generate token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })
  // In a production environment, send email here via SMTP.
  // In demo, we return the token link so the user can use it.
  const resetLink = `/?view=reset-password&token=${token}`
  return json({
    message: 'تم إنشاء رابط استعادة كلمة المرور بنجاح',
    resetLink, // demo only — remove in production
  })
}
