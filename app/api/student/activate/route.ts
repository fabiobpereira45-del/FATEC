import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { activateStudent, EnrollmentError } from "@/lib/repos/enrollment"

// Restrito: ativação manual pela secretaria/master. A ativação automática
// após pagamento chama activateStudent() direto (lib/repos/finance.ts).
export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.studentId) return NextResponse.json({ error: "ID do aluno é obrigatório" }, { status: 400 })
  try {
    const result = await activateStudent(body.studentId)
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err instanceof EnrollmentError ? err.status : 500
    console.error("Activation API Error:", err)
    return NextResponse.json({ error: err.message }, { status })
  }
}
