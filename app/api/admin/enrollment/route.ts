import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { adminCreateOrUpdateStudent, EnrollmentError } from "@/lib/repos/enrollment"

// Matrícula manual pelo admin (cadastro individual ou importação em lote).
// Restrito a master/secretaria.
export async function POST(request: Request) {
  const u = await requireUser(request, ["master", "secretary"])
  if ("error" in u) return u.error
  try {
    const body = await request.json()
    if (!body?.email || !body?.name) {
      return NextResponse.json({ error: "Email e Nome são obrigatórios" }, { status: 400 })
    }
    const result = await adminCreateOrUpdateStudent(body)
    return NextResponse.json({
      success: true,
      message: result.updated ? "Cadastro de aluno atualizado" : "Aluno matriculado com sucesso",
      studentId: result.studentId,
    })
  } catch (err: any) {
    const status = err instanceof EnrollmentError ? err.status : 500
    console.error("Enrollment API Error:", err)
    return NextResponse.json({ error: err.message }, { status })
  }
}
