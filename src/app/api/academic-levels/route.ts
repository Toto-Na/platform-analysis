import { db } from '@/lib/db'
import { json } from '@/lib/api-auth'

export async function GET() {
  const levels = await db.academicLevel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return json(levels)
}
