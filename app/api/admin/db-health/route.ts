import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/db-health?secret=<ADMIN_SECRET>
// Verifies the database is reachable and writable by performing a read and a
// write/delete cycle against the visit_logs table. Returns a structured report
// so you can pinpoint whether the failure is at the connection, read, or write
// layer without needing to dig through server logs.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const report: {
    read: { ok: boolean; error?: string }
    write: { ok: boolean; error?: string }
    databaseUrl: string
  } = {
    read: { ok: false },
    write: { ok: false },
    // Mask credentials but show the path so we can confirm the right file is
    // being used (e.g. file:/app/prisma/dev.db vs an in-memory path).
    databaseUrl: (process.env.DATABASE_URL ?? "(not set)").replace(/\/\/.*@/, "//***@"),
  }

  // --- Read check ---
  try {
    await prisma.visitLog.count()
    report.read = { ok: true }
  } catch (err) {
    report.read = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  // --- Write check ---
  // Insert a sentinel row then immediately delete it so we leave no residue.
  let probeId: number | null = null
  try {
    const probe = await prisma.visitLog.create({
      data: { visitorId: "__db_health_probe__", userAgent: "db-health-check" },
    })
    probeId = probe.id
    report.write = { ok: true }
  } catch (err) {
    report.write = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    if (probeId !== null) {
      try {
        await prisma.visitLog.delete({ where: { id: probeId } })
      } catch {
        // Best-effort cleanup — don't mask the original write result.
      }
    }
  }

  const allOk = report.read.ok && report.write.ok
  return NextResponse.json(report, { status: allOk ? 200 : 500 })
}
