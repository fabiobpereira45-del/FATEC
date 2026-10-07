import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateProfessor, deleteProfessor, getProfessorById } from "@/lib/repos/professors"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { id } = await params
  return NextResponse.json(await getProfessorById(id))
}

// Um professor pode editar o próprio perfil; só master/secretaria editam outros.
export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary", "professor"])
  if ("error" in u) return u.error
  const { id } = await params
  if (id !== u.user.id && u.role !== "master" && u.role !== "secretary") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  if ((body.role !== undefined || body.active !== undefined) && u.role !== "master" && u.role !== "secretary") {
    return NextResponse.json({ error: "Apenas master/secretaria alteram papel ou status." }, { status: 403 })
  }
  return NextResponse.json(await updateProfessor(id, body))
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master"])
  if ("error" in u) return u.error
  const { id } = await params
  const target = await getProfessorById(id)
  if (target?.role === "master") {
    return NextResponse.json({ error: "Não é possível excluir a conta master." }, { status: 400 })
  }
  await deleteProfessor(id)
  return NextResponse.json({ success: true })
}
