import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { visitorId } = await req.json()
    const userAgent = req.headers.get("user-agent") || ""

    await prisma.visitLog.create({
      data: { visitorId, userAgent },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
