import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

const RegisterSchema = z.object({
  name: z.string().min(3, 'الاسم الكامل مطلوب (3 أحرف على الأقل)'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
  academicLevelId: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  }
  const { name, email, password, confirmPassword, academicLevelId } = parsed.data
  if (password !== confirmPassword) {
    return errorJson('كلمتا المرور غير متطابقتين', 422)
  }
  const lowerEmail = email.toLowerCase().trim()
  const exists = await db.user.findUnique({ where: { email: lowerEmail } })
  if (exists) {
    return errorJson('البريد الإلكتروني مستخدم بالفعل', 409)
  }
  // Check if registration is allowed
  const allowRegSetting = await db.systemSetting.findUnique({ where: { key: 'allow_public_registration' } })
  if (allowRegSetting?.value === 'false') {
    return errorJson('تم إيقاف التسجيل العام. يرجى التواصل مع الإدارة', 403)
  }
  const requireApprovalSetting = await db.systemSetting.findUnique({ where: { key: 'require_admin_approval' } })

  // Validate academic level if provided
  if (academicLevelId) {
    const lvl = await db.academicLevel.findUnique({ where: { id: academicLevelId } })
    if (!lvl || !lvl.isActive) {
      return errorJson('المستوى الدراسي غير صالح', 422)
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const isActive = requireApprovalSetting?.value !== 'true'
  const user = await db.user.create({
    data: {
      email: lowerEmail,
      name,
      passwordHash,
      role: 'STUDENT',
      isActive,
      studentProfile: academicLevelId
        ? { create: { academicLevelId } }
        : { create: {} },
    },
  })
  await logAudit({
    action: 'USER_REGISTER',
    targetType: 'USER',
    targetId: user.id,
    description: `تسجيل طالب جديد: ${user.email}`,
  })
  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    message: user.isActive
      ? 'تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول'
      : 'تم إنشاء الحساب. سيتم تفعيله بعد موافقة الإدارة',
  }, 201)
}
