import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import {
  confirmPhysicalBorrow, returnBookLoan, cancelBookLoan, cancelMyReservation,
  renewBookLoan, getLoan,
} from "@/lib/repos/library"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action

  try {
    if (action === "cancelMine") {
      if (u.role !== "student") return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
      return NextResponse.json({ success: true, data: await cancelMyReservation(id, body.studentId) })
    }

    // Demais ações são de staff.
    if (!["master", "secretary", "professor"].includes(u.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    if (action === "confirmBorrow") {
      return NextResponse.json({ success: true, data: await confirmPhysicalBorrow(id, body.registeredBy) })
    }
    if (action === "return") {
      return NextResponse.json({ success: true, data: await returnBookLoan(id) })
    }
    if (action === "cancel") {
      await cancelBookLoan(id)
      return NextResponse.json({ success: true })
    }
    if (action === "renew") {
      return NextResponse.json({ success: true, data: await renewBookLoan(id) })
    }
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function GET(req: Request, { params }: Ctx) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { id } = await params
  const loan = await getLoan(id)
  if (u.role === "student" && (!loan || !(await isOwnStudent(u.user.id, loan.studentId)))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  return NextResponse.json(loan)
}
