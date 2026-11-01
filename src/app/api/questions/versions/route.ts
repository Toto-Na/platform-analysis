import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('STUDENT')
  if (error) return error
  const versions = await db.questionSetVersion.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true, label: true, publishedAt: true },
  })
  return json(versions)
}
