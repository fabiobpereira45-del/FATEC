import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateQuestion, deleteQuestion } from "@/lib/repos/questions"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await updateQuestion(id, await req.json().catch(() => ({})))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteQuestion(id)
  return NextResponse.json({ success: true })
}
