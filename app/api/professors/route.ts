import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listProfessors, createProfessor, getProfessorByEmail } from "@/lib/repos/professors"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary", "professor"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (email) return NextResponse.json(await getProfessorByEmail(email))
  if (u.role !== "master" && u.role !== "secretary") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  return NextResponse.json(await listProfessors())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.password || !body?.role) {
    return NextResponse.json({ error: "Nome, e-mail, senha e papel são obrigatórios." }, { status: 400 })
  }
  if (body.role === "master" && u.role !== "master") {
    return NextResponse.json({ error: "Apenas o master pode criar outro master." }, { status: 403 })
  }
  try {
    const created = await createProfessor(body)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar professor." }, { status: 400 })
  }
}
