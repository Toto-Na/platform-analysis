import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { COMPARISON_STATUS_LABELS } from '@/lib/constants'
import PDFDocument from 'pdfkit'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  const [comparisons, students, websites] = await Promise.all([
    db.comparison.findMany({
      include: {
        student: { include: { studentProfile: { include: { academicLevel: true } } } },
        websites: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.user.findMany({ where: { role: 'STUDENT' }, include: { studentProfile: { include: { academicLevel: true } } } }),
    db.comparisonWebsite.findMany(),
  ])

  const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'portrait' })
  doc.registerFont('NotoSans', '/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf')
  doc.font('NotoSans')

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // Title
  doc.fontSize(20).fillColor('#0F766E').text('تقرير منصة تحليل المواقع الإلكترونية', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(10).fillColor('#666').text(`تاريخ التقرير: ${new Date().toLocaleString('ar')}`, { align: 'center' })
  doc.moveDown(1)

  // Summary
  doc.fontSize(14).fillColor('#0F766E').text('ملخص إحصائي')
  doc.moveDown(0.3)
  doc.fontSize(11).fillColor('#000')
  doc.text(`- إجمالي الطلاب: ${students.length}`)
  doc.text(`- إجمالي المقارنات: ${comparisons.length}`)
  doc.text(`- إجمالي المواقع التي تمت دراستها: ${websites.length}`)
  doc.text(`- المقارنات المعتمدة: ${comparisons.filter((c) => c.status === 'APPROVED').length}`)
  doc.text(`- المقارنات المرسلة: ${comparisons.filter((c) => c.status === 'SUBMITTED').length}`)
  doc.moveDown(1)

  // Comparisons list
  doc.fontSize(14).fillColor('#0F766E').text('قائمة المقارنات')
  doc.moveDown(0.3)
  doc.fontSize(10).fillColor('#000')
  for (const c of comparisons) {
    doc.text(`- ${c.title} | الطالب: ${c.student.name} | الحالة: ${COMPARISON_STATUS_LABELS[c.status as keyof typeof COMPARISON_STATUS_LABELS] ?? c.status} | المواقع: ${c.websites.map((w) => w.name).join('، ')}`)
    doc.moveDown(0.1)
  }

  doc.end()
  const pdfBuffer = await done

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="platform-report-${Date.now()}.pdf"`,
    },
  })
}
