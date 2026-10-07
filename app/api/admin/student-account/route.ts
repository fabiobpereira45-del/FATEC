import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { BRAND } from "@/lib/brand"

// Cria a conta de login de um aluno. Restrito a master e secretaria.
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== "master" && role !== "secretary") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const studentId = typeof body?.studentId === "string" ? body.studentId : ""
  const password = typeof body?.password === "string" ? body.password : ""
  if (!studentId || password.length < 8) {
    return NextResponse.json({ error: "Informe o aluno e uma senha de pelo menos 8 caracteres." }, { status: 400 })
  }

  const { rows } = await pool.query(
    "select id, name, email, cpf, auth_user_id from students where id = $1",
    [studentId]
  )
  const student = rows[0]
  if (!student) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 })
  if (student.auth_user_id) return NextResponse.json({ error: "Este aluno já possui conta." }, { status: 409 })

  const email = (student.email || `${student.cpf}@${BRAND.emailDomain}`).toLowerCase()
  const created = await auth.api.signUpEmail({ body: { email, password, name: student.name } })

  await pool.query(
    `update students
        set auth_user_id = $1, email = $2,
            status = case when status = 'pending' then 'active' else status end
      where id = $3`,
    [created.user.id, email, student.id]
  )
  return NextResponse.json({ success: true, email }, { status: 201 })
}
