import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { settleFinancialCharge, reverseFinancialCharge } from "@/lib/repos/finance"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: "Informe o id." }, { status: 400 })
  if (body.action === "reverse") {
    await reverseFinancialCharge(body.id)
  } else {
    if (!body.paidAmount || !body.method || !body.date) {
      return NextResponse.json({ error: "Dados de quitação incompletos." }, { status: 400 })
    }
    await settleFinancialCharge(body.id, { paidAmount: body.paidAmount, method: body.method, date: body.date })
  }
  return NextResponse.json({ success: true })
}
