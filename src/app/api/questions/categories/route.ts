import { db } from '@/lib/db'
import { json } from '@/lib/api-auth'

export async function GET() {
  const cats = await db.questionCategory.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
  })
  return json(cats)
}
