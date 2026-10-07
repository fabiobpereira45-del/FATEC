import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listDisciplines, createDiscipline } from "@/lib/repos/disciplines"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  return NextResponse.json(await listDisciplines())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "O nome da disciplina é obrigatório." }, { status: 400 })
  }
  return NextResponse.json(await createDiscipline(body), { status: 201 })
}
