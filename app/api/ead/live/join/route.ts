import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { recordLiveSessionJoin } from "@/lib/repos/ead"

export async function POST(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.lessonId || !body?.studentId || !body?.disciplineId) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 })
  }
  if (u.role === "student" && !(await isOwnStudent(u.user.id, body.studentId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const result = await recordLiveSessionJoin(
    body.lessonId, body.studentId, body.studentName || "Aluno", body.disciplineId,
    body.lessonDate, body.minMinutes || 0
  )
  return NextResponse.json(result)
}
