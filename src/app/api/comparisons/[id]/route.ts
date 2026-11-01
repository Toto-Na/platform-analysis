import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth('ANY')
  if (error) return error
  const { id } = await params

  const comparison = await db.comparison.findUnique({
    where: { id },
    include: {
      student: {
        select: { id: true, name: true, email: true, studentProfile: { include: { academicLevel: true } } },
      },
      websites: { orderBy: { sortOrder: 'asc' } },
      answers: true,
      summary: true,
      reviews: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      questionSetVersion: {
        include: {
          items: {
            include: { questionVersion: { include: { question: { include: { category: true } } } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)

  // Authorization: students can only view their own comparisons, or approved public ones
  if (session.user.role === 'STUDENT' && comparison.studentId !== session.user.id) {
    const allowSetting = await db.systemSetting.findUnique({ where: { key: 'allow_public_comparisons' } })
    const policySetting = await db.systemSetting.findUnique({ where: { key: 'public_comparisons_policy' } })
    const policy = policySetting?.value ?? 'AFTER_APPROVED'
    if (allowSetting?.value === 'false' || !(policy === 'AFTER_SUBMIT' ? ['SUBMITTED','UNDER_REVIEW','APPROVED','NEEDS_REVISION'] : ['APPROVED']).includes(comparison.status)) {
      return errorJson('لا تملك صلاحية الوصول إلى هذه المقارنة', 403)
    }
  }

  return json({
    id: comparison.id,
    title: comparison.title,
    status: comparison.status,
    student: comparison.student,
    websites: comparison.websites,
    answers: comparison.answers,
    summary: comparison.summary,
    reviews: comparison.reviews,
    questions: comparison.questionSetVersion?.items.map((it) => ({
      questionVersionId: it.questionVersionId,
      sortOrder: it.sortOrder,
      isRequired: it.isRequired,
      text: it.questionVersion.snapshotText,
      description: it.questionVersion.snapshotDescription,
      answerType: it.questionVersion.snapshotAnswerType,
      options: JSON.parse(it.questionVersion.snapshotOptions || '[]'),
      category: it.questionVersion.question.category
        ? {
            id: it.questionVersion.question.category.id,
            name: it.questionVersion.question.category.name,
            sortOrder: it.questionVersion.question.category.sortOrder,
          }
        : null,
    })) ?? [],
    questionSetVersion: comparison.questionSetVersion
      ? { id: comparison.questionSetVersion.id, versionNumber: comparison.questionSetVersion.versionNumber }
      : null,
    createdAt: comparison.createdAt,
    updatedAt: comparison.updatedAt,
    submittedAt: comparison.submittedAt,
  })
}

const UpdateComparisonSchema = z.object({
  title: z.string().min(3).optional(),
  status: z.enum(['DRAFT', 'COMPLETED']).optional(),
})

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({ where: { id } })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  if (comparison.studentId !== session.user.id) {
    return errorJson('لا تملك صلاحية تعديل هذه المقارنة', 403)
  }
  // Allow editing only in DRAFT/COMPLETED/NEEDS_REVISION states
  if (!['DRAFT', 'COMPLETED', 'NEEDS_REVISION'].includes(comparison.status)) {
    return errorJson('لا يمكن تعديل هذه المقارنة في حالتها الحالية', 422)
  }
  const body = await readJson(req)
  const parsed = UpdateComparisonSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const updated = await db.comparison.update({
    where: { id },
    data: parsed.data,
  })
  return json({ id: updated.id, title: updated.title, status: updated.status })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { session, error } = await requireAuth('STUDENT')
  if (error) return error
  const { id } = await params
  const comparison = await db.comparison.findUnique({ where: { id } })
  if (!comparison) return errorJson('المقارنة غير موجودة', 404)
  if (comparison.studentId !== session.user.id) {
    return errorJson('لا تملك صلاحية حذف هذه المقارنة', 403)
  }
  if (!['DRAFT'].includes(comparison.status)) {
    return errorJson('لا يمكن حذف مقارنة تم إرسالها', 422)
  }
  await db.comparison.delete({ where: { id } })
  await logAudit({
    userId: session.user.id,
    action: 'COMPARISON_DELETE',
    targetType: 'COMPARISON',
    targetId: id,
    description: `حذف مقارنة: ${comparison.title}`,
  })
  return json({ message: 'تم حذف المقارنة' })
}
