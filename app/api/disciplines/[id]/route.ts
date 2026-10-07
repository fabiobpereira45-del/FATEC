import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateDiscipline, deleteDiscipline } from "@/lib/repos/disciplines"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  await updateDiscipline(id, body)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteDiscipline(id)
  return NextResponse.json({ success: true })
}
