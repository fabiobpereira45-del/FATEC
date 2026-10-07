import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listClassCurriculum, saveClassCurriculumItem } from "@/lib/repos/class-curriculum"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId")
  if (!classId) return NextResponse.json({ error: "Informe classId." }, { status: 400 })
  return NextResponse.json(await listClassCurriculum(classId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.item?.classId || !body?.item?.disciplineId) {
    return NextResponse.json({ error: "Turma e disciplina são obrigatórias." }, { status: 400 })
  }
  await saveClassCurriculumItem(body.item, body.id)
  return NextResponse.json({ success: true }, { status: 201 })
}
