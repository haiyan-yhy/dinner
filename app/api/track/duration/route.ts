import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { visitorId, pageName, enterTime, leaveTime, durationSeconds } = await req.json()

    await prisma.pageDurationLog.create({
      data: {
        visitorId,
        pageName,
        enterTime: new Date(enterTime),
        leaveTime: leaveTime ? new Date(leaveTime) : null,
        durationSeconds: durationSeconds ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
