import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getAttendanceLock, lockAttendance, unlockAttendance } from "@/lib/repos/attendance"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId")
  const date = searchParams.get("date")
  if (!disciplineId || !date) return NextResponse.json({ error: "Informe disciplineId e date." }, { status: 400 })
  return NextResponse.json(await getAttendanceLock(disciplineId, date))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.disciplineId || !body?.date) {
    return NextResponse.json({ error: "Informe disciplineId e date." }, { status: 400 })
  }
  const lockedBy = u.role === "master" ? "master" : u.user.id
  await lockAttendance(body.disciplineId, body.date, lockedBy)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Informe id." }, { status: 400 })
  await unlockAttendance(id)
  return NextResponse.json({ success: true })
}
