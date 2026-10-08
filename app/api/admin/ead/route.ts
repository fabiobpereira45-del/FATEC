import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listEadLessons, createEadLesson, updateEadLesson, deleteEadLesson } from "@/lib/repos/ead"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId")
  if (!disciplineId) return NextResponse.json({ error: "disciplineId é obrigatório" }, { status: 400 })
  return NextResponse.json({ success: true, data: await listEadLessons(disciplineId) })
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.disciplineId || !body?.title || !body?.videoUrl) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes (disciplineId, title, videoUrl)" }, { status: 400 })
  }
  const data = await createEadLesson(body)
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: "ID da aula é obrigatório" }, { status: 400 })
  const { id, ...rest } = body
  const data = await updateEadLesson(id, rest)
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
  await deleteEadLesson(id)
  return NextResponse.json({ success: true })
}
