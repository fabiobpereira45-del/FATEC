import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { listChatMessages, sendChatMessage } from "@/lib/repos/chat"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId")
  const studentId = searchParams.get("studentId")
  if (!disciplineId || !studentId) return NextResponse.json({ error: "Informe disciplineId e studentId." }, { status: 400 })
  if (u.role === "student" && !(await isOwnStudent(u.user.id, studentId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  return NextResponse.json(await listChatMessages(disciplineId, studentId))
}

export async function POST(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.studentId || !body?.disciplineId || !body?.message) {
    return NextResponse.json({ error: "Dados da mensagem incompletos." }, { status: 400 })
  }
  if (u.role === "student" && !(await isOwnStudent(u.user.id, body.studentId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const isFromStudent = u.role === "student"
  return NextResponse.json(await sendChatMessage(body.studentId, body.disciplineId, body.message, isFromStudent), { status: 201 })
}
