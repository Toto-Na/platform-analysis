import { db } from '@/lib/db'
import { json, errorJson, requireAuth } from '@/lib/api-auth'
import { readJson, getCurrentUserFull } from '@/lib/api-auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const { session, error } = await requireAuth('ANY')
  if (error) return error
  const user = await getCurrentUserFull()
  if (!user) return errorJson('المستخدم غير موجود', 404)
  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    academicLevel: user.studentProfile?.academicLevel ?? null,
    avatarUrl: user.studentProfile?.avatarUrl ?? null,
    bio: user.studentProfile?.bio ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  })
}

const UpdateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  academicLevelId: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth('ANY')
  if (error) return error
  const body = await readJson(req)
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true },
  })
  if (!user) return errorJson('المستخدم غير موجود', 404)

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name ?? user.name },
  })

  if (user.role === 'STUDENT') {
    const profileData: any = {}
    if (parsed.data.academicLevelId !== undefined) {
      if (parsed.data.academicLevelId) {
        const lvl = await db.academicLevel.findUnique({ where: { id: parsed.data.academicLevelId } })
        if (!lvl) return errorJson('المستوى الدراسي غير صالح', 422)
      }
      profileData.academicLevelId = parsed.data.academicLevelId
    }
    if (parsed.data.bio !== undefined) profileData.bio = parsed.data.bio
    if (parsed.data.avatarUrl !== undefined) profileData.avatarUrl = parsed.data.avatarUrl
    if (user.studentProfile) {
      await db.studentProfile.update({
        where: { userId: user.id },
        data: profileData,
      })
    } else {
      await db.studentProfile.create({
        data: { userId: user.id, ...profileData },
      })
    }
  }
  return json({ message: 'تم تحديث البيانات بنجاح' })
}
