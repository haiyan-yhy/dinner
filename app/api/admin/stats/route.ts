import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function extractKeywords(texts: (string | null)[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  const stopwords = new Set(["的", "了", "和", "是", "在", "有", "不", "也", "都", "个", "吃", "一", "我", "要"])

  for (const text of texts) {
    if (!text) continue
    // Split by common delimiters and keep Chinese/English words
    const words = text.split(/[,，、。！!?？\s]+/).filter((w) => w.length >= 2 && !stopwords.has(w))
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }
  }

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [
    totalVisitors,
    totalRecommendations,
    totalWeeklyPlans,
    returningVisitors,
    avgDurationResult,
    recentInputs,
    recentOutputs,
    recentWeeklyPlans,
    keywordSource,
  ] = await Promise.all([
    prisma.visitorStat.count(),
    prisma.recommendationLog.count(),
    prisma.weeklyPlanLog.count(),
    prisma.visitorStat.count({ where: { visitCount: { gt: 1 } } }),
    prisma.pageDurationLog.aggregate({
      _avg: { durationSeconds: true },
      where: { durationSeconds: { not: null } },
    }),
    prisma.recommendationLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, createdAt: true, peopleCount: true,
        budget: true, flavor: true, ingredients: true, remark: true,
      },
    }),
    prisma.recommendationLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, aiResponse: true },
    }),
    prisma.weeklyPlanLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, weeklyPlanResponse: true },
    }),
    prisma.recommendationLog.findMany({
      select: { flavor: true, remark: true },
    }),
  ])

  const allTexts = keywordSource.flatMap((r) => [r.flavor, r.remark])
  const keywords = extractKeywords(allTexts)

  return NextResponse.json({
    totalVisitors,
    totalRecommendations,
    totalWeeklyPlans,
    returningVisitors,
    avgDurationSeconds: avgDurationResult._avg.durationSeconds ?? 0,
    recentInputs,
    recentOutputs,
    recentWeeklyPlans,
    keywords,
  })
}
