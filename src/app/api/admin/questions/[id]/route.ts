import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { json, errorJson, readJson, requireAuth } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const q = await db.question.findUnique({
    where: { id },
    include: { category: true, options: { orderBy: { sortOrder: 'asc' } }, versions: { orderBy: { versionNumber: 'desc' } } },
  })
  if (!q) return errorJson('السؤال غير موجود', 404)
  return json(q)
}

const UpdateSchema = z.object({
  categoryId: z.string().optional(),
  text: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  answerType: z.enum([
    'SHORT_TEXT','LONG_TEXT','SINGLE_CHOICE','MULTIPLE_CHOICE',
    'RATING_1_5','RATING_LEVELS','YES_NO','URL',
  ]).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().optional(),
  status: z.enum(['ACTIVE','INACTIVE','ARCHIVED']).optional(),
  options: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1),
    value: z.string().min(1),
    sortOrder: z.number().optional(),
  })).optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  const q = await db.question.findUnique({ where: { id }, include: { options: true } })
  if (!q) return errorJson('السؤال غير موجود', 404)

  const body = await readJson(req)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? 'بيانات غير صالحة', 422)
  const { categoryId, text, description, answerType, isRequired, sortOrder, status, options } = parsed.data

  // Detect meaningful changes to bump version number
  const textChanged = text && text !== q.text
  const typeChanged = answerType && answerType !== q.answerType
  const optionsChanged = options && JSON.stringify(options.map(o => ({ text: o.text, value: o.value }))) !==
    JSON.stringify(q.options.map(o => ({ text: o.text, value: o.value })))

  const data: any = {}
  if (categoryId) data.categoryId = categoryId
  if (text) data.text = text
  if (description !== undefined) data.description = description
  if (answerType) data.answerType = answerType
  if (typeof isRequired === 'boolean') data.isRequired = isRequired
  if (typeof sortOrder === 'number') data.sortOrder = sortOrder
  if (status) data.status = status
  if (textChanged || typeChanged || optionsChanged) {
    data.currentVersionNumber = q.currentVersionNumber + 1
  }

  await db.question.update({ where: { id }, data })

  // Replace options if provided
  if (options) {
    await db.questionOption.deleteMany({ where: { questionId: id } })
    for (let i = 0; i < options.length; i++) {
      await db.questionOption.create({
        data: {
          questionId: id,
          text: options[i].text,
          value: options[i].value,
          sortOrder: options[i].sortOrder ?? i,
        },
      })
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'QUESTION_UPDATE',
    targetType: 'QUESTION',
    targetId: id,
    description: `تعديل سؤال: ${(text ?? q.text).slice(0, 60)}`,
  })

  return json({ message: 'تم تحديث السؤال. انشر إصدارًا جديدًا ليظهر للطلاب' })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth('ADMIN')
  if (error) return error
  const { id } = await params
  // Soft delete: archive
  const q = await db.question.findUnique({ where: { id } })
  if (!q) return errorJson('السؤال غير موجود', 404)
  await db.question.update({ where: { id }, data: { status: 'ARCHIVED' } })
  await logAudit({
    userId: session.user.id,
    action: 'QUESTION_ARCHIVE',
    targetType: 'QUESTION',
    targetId: id,
    description: `أرشفة سؤال: ${q.text.slice(0, 60)}`,
  })
  return json({ message: 'تمت أرشفة السؤال' })
}
