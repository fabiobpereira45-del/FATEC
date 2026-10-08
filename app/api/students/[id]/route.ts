import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getStudent, updateStudent, deleteStudent } from "@/lib/repos/students"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary", "professor", "student"])
  if ("error" in u) return u.error
  const { id } = await params
  const student = await getStudent(id)
  if (u.role === "student" && student?.auth_user_id !== u.user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  return NextResponse.json(student)
}

// Um aluno pode atualizar só a própria avatar/bio; o resto é master/secretaria.
export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary", "student"])
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (u.role === "student") {
    const student = await getStudent(id)
    if (student?.auth_user_id !== u.user.id) return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    const allowed = ["avatar_url", "bio", "name"]
    const extra = Object.keys(body).filter(k => !allowed.includes(k))
    if (extra.length > 0) return NextResponse.json({ error: "Aluno só pode alterar avatar e bio." }, { status: 403 })
  }

  await updateStudent(id, body)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteStudent(id)
  return NextResponse.json({ success: true })
}
