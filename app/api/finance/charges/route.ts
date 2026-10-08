import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { listFinancialCharges, createFinancialCharge } from "@/lib/repos/finance"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary", "professor", "student"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId") || undefined
  // Um aluno só pode ver as próprias cobranças.
  if (u.role === "student" && (!studentId || !(await isOwnStudent(u.user.id, studentId)))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  return NextResponse.json(await listFinancialCharges(studentId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.type || !body?.description || !body?.amount || !body?.dueDate) {
    return NextResponse.json({ error: "Dados da cobrança incompletos." }, { status: 400 })
  }
  return NextResponse.json(await createFinancialCharge(body), { status: 201 })
}
