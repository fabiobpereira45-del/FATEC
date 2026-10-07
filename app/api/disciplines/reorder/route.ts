import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { reorderDisciplines } from "@/lib/repos/disciplines"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.items)) {
    return NextResponse.json({ error: "Itens inválidos." }, { status: 400 })
  }
  await reorderDisciplines(body.items)
  return NextResponse.json({ success: true })
}
