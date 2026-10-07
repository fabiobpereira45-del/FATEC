import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { createQuestionsBatch } from "@/lib/repos/questions"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.questions)) {
    return NextResponse.json({ error: "Lista de questões inválida." }, { status: 400 })
  }
  return NextResponse.json(await createQuestionsBatch(body.questions), { status: 201 })
}
