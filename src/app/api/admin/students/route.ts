import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error

  const url = new URL(req.url)
  const search = url.searchParams.get('search') ?? ''
  const levelId = url.searchParams.get('levelId') ?? ''
  const status = url.searchParams.get('status') ?? '' // 'active' | 'inactive'

  const where: any = { role: 'STUDENT' }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (status === 'active') where.isActive = true
  if (status === 'inactive') where.isActive = false
  if (levelId) {
    where.studentProfile = { academicLevelId: levelId }
  }

  const students = await db.user.findMany({
    where,
    include: {
      studentProfile: { include: { academicLevel: true } },
      _count: { select: { comparisons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      isActive: s.isActive,
      academicLevel: s.studentProfile?.academicLevel ?? null,
      comparisonsCount: s._count.comparisons,
      createdAt: s.createdAt,
      lastLoginAt: s.lastLoginAt,
    })),
  })
}

const CreateStudentSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  academicLevelId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = CreateStudentSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const { name, email, password, academicLevelId, isActive } = parsed.data
  const lowerEmail = email.toLowerCase().trim()
  const exists = await db.user.findUnique({ where: { email: lowerEmail } })
  if (exists) return errorJson('البريد الإلكتروني مستخدم', 409)
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: {
      name,
      email: lowerEmail,
      passwordHash,
      role: 'STUDENT',
      isActive,
      emailVerified: new Date(),
      studentProfile: academicLevelId ? { create: { academicLevelId } } : { create: {} },
    },
  })
  await logAudit({
    userId: session.user.id,
    action: 'STUDENT_CREATE',
    targetType: 'USER',
    targetId: user.id,
    description: `إضافة طالب: ${user.email}`,
  })
  return json({ id: user.id, message: 'تم إنشاء الطالب بنجاح' }, 201)
}
