import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listExpenses, createExpense, createExpenseBatch } from "@/lib/repos/finance"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  return NextResponse.json(await listExpenses())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (Array.isArray(body?.expenses)) {
    await createExpenseBatch(body.expenses)
    return NextResponse.json({ success: true }, { status: 201 })
  }
  if (!body?.description || !body?.amount || !body?.category || !body?.dueDate) {
    return NextResponse.json({ error: "Dados da despesa incompletos." }, { status: 400 })
  }
  return NextResponse.json(await createExpense(body), { status: 201 })
}
