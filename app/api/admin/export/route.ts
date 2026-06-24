import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n")
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const type = req.nextUrl.searchParams.get("type") || "visits"
  let csv = ""
  let filename = ""

  if (type === "visits") {
    const data = await prisma.visitLog.findMany({ orderBy: { visitTime: "desc" } })
    csv = toCSV(
      ["id", "visitor_id", "visit_time", "user_agent"],
      data.map((r) => [r.id, r.visitorId, r.visitTime.toISOString(), r.userAgent])
    )
    filename = "visit_logs.csv"
  } else if (type === "recommendations") {
    const data = await prisma.recommendationLog.findMany({ orderBy: { createdAt: "desc" } })
    csv = toCSV(
      ["id", "visitor_id", "created_at", "people_count", "budget", "flavor", "ingredients", "remark", "ai_response"],
      data.map((r) => [
        r.id, r.visitorId, r.createdAt.toISOString(),
        r.peopleCount, r.budget, r.flavor, r.ingredients, r.remark, r.aiResponse,
      ])
    )
    filename = "recommendation_logs.csv"
  } else if (type === "weekly") {
    const data = await prisma.weeklyPlanLog.findMany({ orderBy: { createdAt: "desc" } })
    csv = toCSV(
      ["id", "visitor_id", "created_at", "people_count", "budget", "flavor", "ingredients", "remark", "weekly_plan_response"],
      data.map((r) => [
        r.id, r.visitorId, r.createdAt.toISOString(),
        r.peopleCount, r.budget, r.flavor, r.ingredients, r.remark, r.weeklyPlanResponse,
      ])
    )
    filename = "weekly_plan_logs.csv"
  } else if (type === "durations") {
    const data = await prisma.pageDurationLog.findMany({ orderBy: { enterTime: "desc" } })
    csv = toCSV(
      ["id", "visitor_id", "page_name", "enter_time", "leave_time", "duration_seconds"],
      data.map((r) => [
        r.id, r.visitorId, r.pageName,
        r.enterTime.toISOString(), r.leaveTime?.toISOString(), r.durationSeconds,
      ])
    )
    filename = "page_duration_logs.csv"
  } else {
    return new NextResponse("Invalid type", { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
