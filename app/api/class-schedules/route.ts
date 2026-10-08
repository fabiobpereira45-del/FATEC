import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listClassSchedules, createClassSchedule } from "@/lib/repos/class-schedules"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  return NextResponse.json(await listClassSchedules())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.classId || !body?.disciplineId) {
    return NextResponse.json({ error: "Turma e disciplina são obrigatórias." }, { status: 400 })
  }
  return NextResponse.json(await createClassSchedule(body), { status: 201 })
}
