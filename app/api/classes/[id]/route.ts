import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateClass, deleteClass } from "@/lib/repos/classes"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await updateClass(id, await req.json().catch(() => ({})))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteClass(id)
  return NextResponse.json({ success: true })
}
