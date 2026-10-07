import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import {
  listProfessorDisciplines, listAllProfessorDisciplines,
  setProfessorFamiliarDisciplines, listDisciplinesByProfessor,
} from "@/lib/repos/professor-disciplines"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const professorId = searchParams.get("professorId")
  const asDisciplines = searchParams.get("asDisciplines") === "1"
  if (professorId && asDisciplines) {
    return NextResponse.json({ success: true, data: await listDisciplinesByProfessor(professorId) })
  }
  const data = professorId ? await listProfessorDisciplines(professorId) : await listAllProfessorDisciplines()
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.professorId) return NextResponse.json({ error: "professorId é obrigatório" }, { status: 400 })
  await setProfessorFamiliarDisciplines(body.professorId, Array.isArray(body.disciplineIds) ? body.disciplineIds : [])
  return NextResponse.json({ success: true, count: body.disciplineIds?.length || 0 })
}
