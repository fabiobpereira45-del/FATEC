import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateBoardMemberAvatar } from "@/lib/repos/board"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  if (typeof body.avatar_url !== "string") return NextResponse.json({ error: "avatar_url é obrigatório." }, { status: 400 })
  await updateBoardMemberAvatar(id, body.avatar_url)
  return NextResponse.json({ success: true })
}
