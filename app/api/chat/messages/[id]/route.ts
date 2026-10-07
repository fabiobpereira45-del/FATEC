import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { markChatAsRead } from "@/lib/repos/chat"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { id } = await params
  await markChatAsRead(id)
  return NextResponse.json({ success: true })
}
