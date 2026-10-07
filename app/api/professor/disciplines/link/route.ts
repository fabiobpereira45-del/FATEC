import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { linkProfessorToDiscipline, unlinkProfessorFromDiscipline } from "@/lib/repos/professor-disciplines"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.professorId || !body?.disciplineId) {
    return NextResponse.json({ error: "professorId e disciplineId são obrigatórios." }, { status: 400 })
  }
  await linkProfessorToDiscipline(body.professorId, body.disciplineId)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const professorId = searchParams.get("professorId")
  const disciplineId = searchParams.get("disciplineId")
  if (!professorId || !disciplineId) {
    return NextResponse.json({ error: "professorId e disciplineId são obrigatórios." }, { status: 400 })
  }
  await unlinkProfessorFromDiscipline(professorId, disciplineId)
  return NextResponse.json({ success: true })
}
