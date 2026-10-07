import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listClassmates } from "@/lib/repos/students"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId")
  if (!classId) return NextResponse.json({ error: "Informe classId." }, { status: 400 })
  return NextResponse.json(await listClassmates(classId))
}
