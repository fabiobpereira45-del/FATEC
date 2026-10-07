import { NextResponse } from "next/server"
import { createEnrollment, EnrollmentError } from "@/lib/repos/enrollment"

// Pública: formulário de matrícula, sem login.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const { name, cpf, phone, address, church, pastor } = body || {}
    if (!name || !cpf || !phone || !address || !church || !pastor) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos." }, { status: 400 })
    }
    const result = await createEnrollment(body)
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err instanceof EnrollmentError ? err.status : 500
    console.error("Enrollment Error:", err)
    return NextResponse.json({ error: err.message || "Erro ao matricular." }, { status })
  }
}
