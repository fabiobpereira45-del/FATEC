import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listSemesters, createSemester } from "@/lib/repos/semesters"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  return NextResponse.json(await listSemesters())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.name || typeof body.order !== "number") {
    return NextResponse.json({ error: "Nome e ordem são obrigatórios." }, { status: 400 })
  }
  return NextResponse.json(await createSemester(body), { status: 201 })
}
