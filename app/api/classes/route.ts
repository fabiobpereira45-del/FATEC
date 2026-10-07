import { NextResponse } from "next/server"
import { listClasses, createClass } from "@/lib/repos/classes"
import { requireUser } from "@/lib/api-auth"

// A listagem é pública (usada na matrícula, antes do login).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const poloId = searchParams.get("poloId") || undefined
  return NextResponse.json(await listClasses(poloId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.shift || !body?.maxStudents) {
    return NextResponse.json({ error: "Nome, turno e capacidade são obrigatórios." }, { status: 400 })
  }
  return NextResponse.json(await createClass(body), { status: 201 })
}
