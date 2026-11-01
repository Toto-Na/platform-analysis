import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

const CreateComparisonSchema = z.object({
  title: z.string().min(3, 'عنوان المقارنة مطلوب (3 أحرف على الأقل)'),
  websites: z
    .array(
      z.object({
        name: z.string().min(1, 'اسم الموقع مطلوب'),
        url: z.string().url('رابط الموقع غير صالح'),
        businessType: z.string().optional().nullable(),
      }),
    )
    .min(2, 'يجب اختيار موقعين على الأقل')
    .max(4, 'لا يمكن اختيار أكثر من 4 مواقع'),
})

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error

  const body = await readJson(req)
  const parsed = CreateComparisonSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  }
  const { title, websites } = parsed.data

  // Validate website count against system settings
  const minSetting = await db.systemSetting.findUnique({ where: { key: 'min_websites' } })
  const maxSetting = await db.systemSetting.findUnique({ where: { key: 'max_websites' } })
  const min = parseInt(minSetting?.value ?? '2', 10)
  const max = parseInt(maxSetting?.value ?? '4', 10)
  if (websites.length < min) {
    return errorJson(`يجب اختيار ${min} مواقع على الأقل`, 422)
  }
  if (websites.length > max) {
    return errorJson(`لا يمكن اختيار أكثر من ${max} مواقع`, 422)
  }

  // Get current published question set version
  const setVersion = await db.questionSetVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
    include: { items: { include: { questionVersion: true } } },
  })
  if (!setVersion) {
    return errorJson('لا توجد مجموعة أسئلة منشورة بعد. يرجى المحاولة لاحقًا', 500)
  }

  // Create comparison in a transaction
  const comparison = await db.$transaction(async (tx) => {
    const c = await tx.comparison.create({
      data: {
        studentId: session.user.id,
        title,
        status: 'DRAFT',
        questionSetVersionId: setVersion.id,
        websites: {
          create: websites.map((w, i) => ({
            name: w.name,
            url: w.url,
            businessType: w.businessType ?? null,
            sortOrder: i,
          })),
        },
      },
      include: { websites: true },
    })
    return c
  })

  await logAudit({
    userId: session.user.id,
    action: 'COMPARISON_CREATE',
    targetType: 'COMPARISON',
    targetId: comparison.id,
    description: `إنشاء مقارنة: ${title}`,
  })

  return json(
    {
      id: comparison.id,
      title: comparison.title,
      status: comparison.status,
      websites: comparison.websites.map((w) => ({ id: w.id, name: w.name, url: w.url })),
      questionSetVersionId: comparison.questionSetVersionId,
    },
    201,
  )
}
