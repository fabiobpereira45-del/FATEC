import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listUserLogs, logUserActivity } from "@/lib/repos/user-logs"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit")) || 100
  return NextResponse.json(await listUserLogs(limit))
}

// Qualquer usuário autenticado pode registrar a própria atividade.
export async function POST(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.action) return NextResponse.json({ error: "action é obrigatório." }, { status: 400 })
  await logUserActivity(body)
  return NextResponse.json({ success: true })
}
