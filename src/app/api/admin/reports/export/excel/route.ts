import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'
import ExcelJS from 'exceljs'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  const comparisons = await db.comparison.findMany({
    include: {
      student: { include: { studentProfile: { include: { academicLevel: true } } } },
      websites: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Platform Admin'
  wb.created = new Date()

  // Sheet 1: Comparisons
  const ws1 = wb.addWorksheet('المقارنات', { views: [{ rightToLeft: true }] })
  ws1.columns = [
    { header: 'عنوان المقارنة', key: 'title', width: 35 },
    { header: 'الطالب', key: 'student', width: 25 },
    { header: 'البريد', key: 'email', width: 28 },
    { header: 'المستوى', key: 'level', width: 18 },
    { header: 'المواقع', key: 'websites', width: 40 },
    { header: 'عدد المواقع', key: 'count', width: 12 },
    { header: 'الحالة', key: 'status', width: 18 },
    { header: 'تاريخ الإنشاء', key: 'createdAt', width: 20 },
    { header: 'تاريخ الإرسال', key: 'submittedAt', width: 20 },
  ]
  ws1.getRow(1).font = { bold: true }
  ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
  ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  for (const c of comparisons) {
    ws1.addRow({
      title: c.title,
      student: c.student.name,
      email: c.student.email,
      level: c.student.studentProfile?.academicLevel?.name ?? '',
      websites: c.websites.map((w) => w.name).join('، '),
      count: c.websites.length,
      status: COMPARISON_STATUS_LABELS[c.status as keyof typeof COMPARISON_STATUS_LABELS] ?? c.status,
      createdAt: c.createdAt.toLocaleString('ar'),
      submittedAt: c.submittedAt ? c.submittedAt.toLocaleString('ar') : '',
    })
  }

  // Sheet 2: Students summary
  const ws2 = wb.addWorksheet('الطلاب', { views: [{ rightToLeft: true }] })
  ws2.columns = [
    { header: 'الاسم', key: 'name', width: 25 },
    { header: 'البريد', key: 'email', width: 28 },
    { header: 'المستوى', key: 'level', width: 18 },
    { header: 'الحالة', key: 'isActive', width: 14 },
    { header: 'تاريخ التسجيل', key: 'createdAt', width: 20 },
  ]
  ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
  ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    include: { studentProfile: { include: { academicLevel: true } } },
  })
  for (const s of students) {
    ws2.addRow({
      name: s.name,
      email: s.email,
      level: s.studentProfile?.academicLevel?.name ?? '',
      isActive: s.isActive ? 'نشط' : 'معطل',
      createdAt: s.createdAt.toLocaleString('ar'),
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="platform-report-${Date.now()}.xlsx"`,
    },
  })
}
