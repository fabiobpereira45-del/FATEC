import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listAttendances, listStudentAttendances, saveAttendance } from "@/lib/repos/attendance"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId")
  const studentId = searchParams.get("studentId")
  if (studentId) return NextResponse.json(await listStudentAttendances(studentId))
  if (!disciplineId) return NextResponse.json({ error: "Informe disciplineId ou studentId." }, { status: 400 })
  return NextResponse.json(await listAttendances(disciplineId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.studentId || !body?.disciplineId || !body?.date || typeof body?.isPresent !== "boolean") {
    return NextResponse.json({ error: "Dados de frequência incompletos." }, { status: 400 })
  }
  await saveAttendance(body.studentId, body.disciplineId, body.date, body.isPresent)
  return NextResponse.json({ success: true })
}
