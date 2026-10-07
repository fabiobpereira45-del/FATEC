import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { BRAND } from "@/lib/brand"

// Login do aluno: aceita CPF, matrícula ou e-mail. Não cria contas.
// As contas são criadas pelo administrador em /api/admin/student-account.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  if (!identifier || !password) {
    return NextResponse.json({ error: "Informe o identificador e a senha." }, { status: 400 })
  }

  const digits = identifier.replace(/\D/g, "")
  const { rows } = await pool.query(
    `select id, name, email, cpf, auth_user_id, status
       from students
      where lower(email) = lower($1) or enrollment_number = $1 or ($2 <> '' and cpf = $2)
      limit 1`,
    [identifier, digits]
  )
  const student = rows[0]
  // Mensagem genérica: não revela se o aluno existe.
  const invalid = NextResponse.json({ error: "Identificador ou senha inválidos." }, { status: 401 })
  if (!student || student.status === "inactive") return invalid

  const email = student.email || `${student.cpf}@${BRAND.emailDomain}`
  const res = await auth.api.signInEmail({ body: { email, password }, asResponse: true })
  if (!res.ok) return invalid

  const data = await res.clone().json()
  if (!student.auth_user_id && data?.user?.id) {
    await pool.query("update students set auth_user_id = $1 where id = $2", [data.user.id, student.id])
  }

  const out = NextResponse.json({ success: true, studentId: student.id, name: student.name })
  res.headers.getSetCookie().forEach(cookie => out.headers.append("set-cookie", cookie))
  return out
}
