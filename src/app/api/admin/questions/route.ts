import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'
import { ANSWER_TYPE_LABELS } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId')
  const answerType = url.searchParams.get('answerType')
  const status = url.searchParams.get('status') ?? 'ACTIVE'

  const where: any = {}
  if (categoryId) where.categoryId = categoryId
  if (answerType) where.answerType = answerType
  if (status !== 'ALL') where.status = status

  const questions = await db.question.findMany({
    where,
    include: { category: true, options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return json({
    questions: questions.map((q) => ({
      id: q.id,
      text: q.text,
      description: q.description,
      answerType: q.answerType,
      answerTypeLabel: ANSWER_TYPE_LABELS[q.answerType as keyof typeof ANSWER_TYPE_LABELS] ?? q.answerType,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      status: q.status,
      currentVersionNumber: q.currentVersionNumber,
      category: q.category,
      options: q.options,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    })),
  })
}

const CreateQuestionSchema = z.object({
  categoryId: z.string(),
  text: z.string().min(3, 'نص السؤال مطلوب'),
  description: z.string().optional().nullable(),
  answerType: z.enum([
    'SHORT_TEXT','LONG_TEXT','SINGLE_CHOICE','MULTIPLE_CHOICE',
    'RATING_1_5','RATING_LEVELS','YES_NO','URL',
  ]),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().default(0),
  options: z.array(z.object({
    text: z.string().min(1),
    value: z.string().min(1),
  })).optional().default([]),
})

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const body = await readJson(req)
  const parsed = CreateQuestionSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const { categoryId, text, description, answerType, isRequired, sortOrder, options } = parsed.data

  const category = await db.questionCategory.findUnique({ where: { id: categoryId } })
  if (!category) return errorJson('القسم غير موجود', 404)

  // Validate options for choice-based types
  const needsOptions = ['SINGLE_CHOICE','MULTIPLE_CHOICE','RATING_LEVELS','YES_NO']
  if (needsOptions.includes(answerType) && (!options || options.length === 0)) {
    return errorJson('هذا النوع من الأسئلة يتطلب خيارات إجابة', 422)
  }

  const q = await db.question.create({
    data: {
      categoryId,
      text,
      description: description ?? null,
      answerType,
      isRequired,
      sortOrder,
      status: 'ACTIVE',
      options: options?.length
        ? { create: options.map((o, i) => ({ text: o.text, value: o.value, sortOrder: i })) }
        : undefined,
    },
    include: { options: true, category: true },
  })

  await logAudit({
    userId: session.user.id,
    action: 'QUESTION_CREATE',
    targetType: 'QUESTION',
    targetId: q.id,
    description: `إضافة سؤال: ${text.slice(0, 60)}`,
  })

  return json(q, 201)
}
