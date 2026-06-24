import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { visitorId } = await req.json()

    const existing = await prisma.visitorStat.findUnique({ where: { visitorId } })

    if (existing) {
      await prisma.visitorStat.update({
        where: { visitorId },
        data: { lastVisitTime: new Date(), visitCount: { increment: 1 } },
      })
    } else {
      await prisma.visitorStat.create({ data: { visitorId } })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
