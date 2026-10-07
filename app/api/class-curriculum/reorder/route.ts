import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { reorderClassCurriculum } from "@/lib/repos/class-curriculum"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.ids)) return NextResponse.json({ error: "Lista inválida." }, { status: 400 })
  await reorderClassCurriculum(body.ids)
  return NextResponse.json({ success: true })
}
