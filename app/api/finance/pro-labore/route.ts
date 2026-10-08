import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { settleProLabore } from "@/lib/repos/finance"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.professorId || !body?.disciplineId || !body?.classId || !body?.amount || !body?.description) {
    return NextResponse.json({ error: "Dados do pró-labore incompletos." }, { status: 400 })
  }
  return NextResponse.json(await settleProLabore(body), { status: 201 })
}
