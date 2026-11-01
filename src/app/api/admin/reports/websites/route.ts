import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  // Find all comparison websites and count by URL/name
  const websites = await db.comparisonWebsite.findMany({
    select: { name: true, url: true, businessType: true },
  })
  const map = new Map<string, { name: string; url: string; businessType: string | null; count: number }>()
  for (const w of websites) {
    const key = w.url
    if (!map.has(key)) {
      map.set(key, { name: w.name, url: w.url, businessType: w.businessType, count: 0 })
    }
    map.get(key)!.count++
  }
  const ranked = Array.from(map.values()).sort((a, b) => b.count - a.count)

  // Business types distribution
  const typeMap = new Map<string, number>()
  for (const w of websites) {
    const t = w.businessType ?? 'غير محدد'
    typeMap.set(t, (typeMap.get(t) ?? 0) + 1)
  }
  const typesRanked = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return json({
    mostCompared: ranked.slice(0, 15),
    businessTypes: typesRanked,
    totalWebsitesAnalyzed: websites.length,
    uniqueWebsites: map.size,
  })
}
