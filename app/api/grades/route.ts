import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listStudentGrades, saveStudentGrade } from "@/lib/repos/grades"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  return NextResponse.json(await listStudentGrades())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.grade?.studentIdentifier) {
    return NextResponse.json({ error: "Identificador do aluno é obrigatório." }, { status: 400 })
  }
  await saveStudentGrade(body.grade, body.id)
  return NextResponse.json({ success: true }, { status: 201 })
}
