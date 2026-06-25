import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { visitorId, pageName, enterTime, leaveTime, durationSeconds } = await req.json()

    await prisma.pageDurationLog.create({
      data: {
        visitorId,
        pageName,
        enterTime: new Date(Number(enterTime)),
        leaveTime: leaveTime ? new Date(Number(leaveTime)) : null,
        durationSeconds: durationSeconds ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[track/duration] Failed to write PageDurationLog:", err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
