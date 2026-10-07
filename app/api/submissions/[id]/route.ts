import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateSubmissionScore, deleteSubmission } from "@/lib/repos/submissions"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  if (typeof body.score !== "number" || typeof body.totalPoints !== "number") {
    return NextResponse.json({ error: "Nota inválida." }, { status: 400 })
  }
  await updateSubmissionScore(id, body.score, body.totalPoints)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteSubmission(id)
  return NextResponse.json({ success: true })
}
