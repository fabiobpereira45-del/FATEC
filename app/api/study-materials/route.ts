import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listStudyMaterials, createStudyMaterial } from "@/lib/repos/study-materials"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId") || undefined
  return NextResponse.json(await listStudyMaterials(disciplineId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.disciplineId || !body?.title || !body?.fileUrl) {
    return NextResponse.json({ error: "Disciplina, título e arquivo são obrigatórios." }, { status: 400 })
  }
  return NextResponse.json(await createStudyMaterial(body), { status: 201 })
}
