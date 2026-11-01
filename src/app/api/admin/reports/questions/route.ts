import { db } from '@/lib/db'
import { json, requireAuth } from '@/lib/api-auth'

// Aggregates common strengths, weaknesses, and improvement suggestions
// from the final 3 questions (feature liked, weakness, improvement).
export async function GET() {
  const { error } = await requireAuth('ADMIN')
  if (error) return error

  // Find the last 3 active questions (strength / weakness / improvement) snapshots
  const setVersion = await db.questionSetVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
    include: {
      items: {
        include: { questionVersion: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!setVersion) return json({ strengths: [], weaknesses: [], improvements: [], totalAnswers: 0 })

  // All question versions in the set, with snapshot text
  const allQVs = setVersion.items.map((i) => i.questionVersion)

  // Identify the strength / weakness / improvement questions by text heuristics
  const strengthQ = allQVs.find((q) => q.snapshotText.includes('ميزة') && q.snapshotText.includes('أعجبتكم'))
  const weaknessQ = allQVs.find((q) => q.snapshotText.includes('نقطة ضعف') || q.snapshotText.includes('مشكلة'))
  const improvementQ = allQVs.find((q) => q.snapshotText.includes('تحسين'))

  async function collectAnswers(qvId: string | undefined) {
    if (!qvId) return []
    const answers = await db.answer.findMany({
      where: { questionVersionId: qvId },
      select: { value: true },
    })
    return answers.map((a) => a.value.trim()).filter(Boolean)
  }

  const [strengthsRaw, weaknessesRaw, improvementsRaw] = await Promise.all([
    collectAnswers(strengthQ?.id),
    collectAnswers(weaknessQ?.id),
    collectAnswers(improvementQ?.id),
  ])

  // Count word frequency (simple)
  function topWords(items: string[]): { word: string; count: number }[] {
    const freq = new Map<string, number>()
    for (const t of items) {
      const words = t.toLowerCase().split(/[\s,،.؛!?؟!]+/).filter((w) => w.length > 2)
      for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)
    }
    return Array.from(freq.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }

  return json({
    strengths: strengthsRaw,
    weaknesses: weaknessesRaw,
    improvements: improvementsRaw,
    topStrengthWords: topWords(strengthsRaw),
    topWeaknessWords: topWords(weaknessesRaw),
    totalAnswers: strengthsRaw.length + weaknessesRaw.length + improvementsRaw.length,
  })
}
