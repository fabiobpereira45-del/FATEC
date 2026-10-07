import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getGradeSettings, saveGradeSettings } from "@/lib/repos/grades"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  return NextResponse.json(await getGradeSettings())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  await saveGradeSettings(body)
  return NextResponse.json({ success: true })
}
