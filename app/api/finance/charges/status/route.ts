import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateFinancialChargeStatus, updateFinancialChargesStatusBatch } from "@/lib/repos/finance"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.status) return NextResponse.json({ error: "Informe o status." }, { status: 400 })
  if (Array.isArray(body.ids)) {
    await updateFinancialChargesStatusBatch(body.ids, body.status)
  } else if (body.id) {
    await updateFinancialChargeStatus(body.id, body.status)
  } else {
    return NextResponse.json({ error: "Informe id ou ids." }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
