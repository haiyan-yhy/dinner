import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { visitorId, pageName, enterTime, leaveTime, durationSeconds } = await req.json()

    const enterTimestamp = Number(enterTime)
    if (!Number.isFinite(enterTimestamp)) {
      console.error("[track/duration] Invalid enterTime value received:", enterTime)
      return NextResponse.json(
        { ok: false, error: `Invalid enterTime: expected a numeric timestamp, got ${JSON.stringify(enterTime)}` },
        { status: 400 }
      )
    }

    const leaveTimestamp = leaveTime != null ? Number(leaveTime) : null
    if (leaveTimestamp !== null && !Number.isFinite(leaveTimestamp)) {
      console.error("[track/duration] Invalid leaveTime value received:", leaveTime)
      return NextResponse.json(
        { ok: false, error: `Invalid leaveTime: expected a numeric timestamp, got ${JSON.stringify(leaveTime)}` },
        { status: 400 }
      )
    }

    await prisma.pageDurationLog.create({
      data: {
        visitorId,
        pageName,
        enterTime: new Date(enterTimestamp),
        leaveTime: leaveTimestamp !== null ? new Date(leaveTimestamp) : null,
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
