import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"
import { BRAND } from "@/lib/brand"
import crypto from "crypto"

export interface EnrollmentInput {
  name: string
  cpf: string
  phone: string
  address: string
  church: string
  pastor: string
  classId?: string | null
  amount?: number
  poloId?: string | null
  modality?: string | null
  email?: string | null
}

export class EnrollmentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Cria a matrícula (status "pending") e a cobrança da matrícula.
// Não cria conta de login aqui: a conta só é criada na ativação (após o
// pagamento), com senha aleatória — nunca com uma senha previsível.
export async function createEnrollment(input: EnrollmentInput) {
  const cleanCpf = input.cpf.replace(/\D/g, "")
  if (!cleanCpf) throw new EnrollmentError("CPF inválido.", 400)

  const { rows: existing } = await pool.query(
    "select id from students where cpf = $1 and status <> 'pending'", [cleanCpf]
  )
  if (existing[0]) throw new EnrollmentError("Este CPF já possui uma matrícula confirmada.", 409)

  // Remove tentativa anterior abandonada (pendente) com o mesmo CPF.
  await pool.query("delete from students where cpf = $1 and status = 'pending'", [cleanCpf])

  if (input.classId) {
    const { rows: clsRows } = await pool.query("select max_students from classes where id = $1::uuid", [input.classId])
    if (clsRows[0]) {
      const { rows: countRows } = await pool.query(
        "select count(*)::int as n from students where class_id = $1::uuid", [input.classId]
      )
      if (countRows[0].n >= clsRows[0].max_students) {
        throw new EnrollmentError("Esta turma já está com as vagas esgotadas.", 403)
      }
    }
  }

  const enrollmentNumber = `FATEC-${Date.now().toString().slice(-8)}`
  const nameUC = (input.name || "").toUpperCase().trim()
  const studentEmail = input.email?.trim() ? input.email.trim().toLowerCase() : `${cleanCpf}@${BRAND.emailDomain}`

  const { rows: studentRows } = await pool.query(
    `insert into students
       (name, cpf, email, enrollment_number, phone, address, church, pastor_name,
        class_id, polo_id, modality, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::uuid,$10,$11,'pending')
     returning id`,
    [nameUC, cleanCpf, studentEmail, enrollmentNumber, input.phone.trim(), input.address.trim(),
     input.church.trim(), input.pastor.trim(), input.classId || null,
     input.poloId || "polo-tancredo-neves", input.modality || "presencial"]
  )
  const studentId = studentRows[0].id

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)
  const { rows: chargeRows } = await pool.query(
    `insert into financial_charges (student_id, type, description, amount, due_date, status)
     values ($1::uuid, 'enrollment', $2, $3, $4::date, 'pending') returning id`,
    [studentId, `Matrícula - ${nameUC}`, input.amount || 0, dueDate.toISOString().split("T")[0]]
  )

  return { studentId, enrollmentNumber, chargeId: chargeRows[0].id }
}

// Autocadastro do aluno: ele mesmo escolhe a senha (não é uma senha previsível).
export async function registerStudent(name: string, cpf: string, password: string) {
  const cleanCpf = cpf.replace(/\D/g, "")
  const email = `${cleanCpf}@${BRAND.emailDomain}`
  const matricula = `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`

  const created = await auth.api.signUpEmail({ body: { email, password, name } })
  try {
    await pool.query(
      `insert into students (auth_user_id, name, cpf, email, enrollment_number, status)
       values ($1, $2, $3, $4, $5, 'pending')`,
      [created.user.id, name, cleanCpf, email, matricula]
    )
  } catch (err) {
    // Reverte a conta criada se o cadastro do aluno falhar (ex.: CPF duplicado).
    await pool.query('delete from "user" where id = $1', [created.user.id]).catch(() => {})
    throw err
  }
  return { matricula, name }
}

export interface AdminStudentInput {
  name: string
  email: string
  password?: string // se vazio, a conta nasce depois, na ativação (senha aleatória)
  cpf?: string
  phone?: string
  address?: string
  church?: string
  pastor_name?: string
  class_id?: string | null
  payment_status?: string
  enrollment_number?: string
  polo_id?: string | null
}

// Cria ou atualiza um aluno diretamente pelo admin (matrícula manual ou
// importação em lote). Só cria conta de login se uma senha for explicitamente
// informada — na importação em lote, nenhuma senha é definida aqui, evitando
// que vários alunos acabem com a mesma senha previsível.
export async function adminCreateOrUpdateStudent(data: AdminStudentInput) {
  const email = data.email.toLowerCase().trim()
  const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, "") : null
  const matricula = data.enrollment_number || `${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`

  const { rows: existing } = await pool.query("select id, auth_user_id from students where email = $1", [email])

  let authUserId: string | null = existing[0]?.auth_user_id || null
  if (!authUserId && data.password) {
    if (data.password.length < 8) throw new EnrollmentError("A senha deve ter ao menos 8 caracteres.", 400)
    const created = await auth.api.signUpEmail({ body: { email, password: data.password, name: data.name.toUpperCase().trim() } })
    authUserId = created.user.id
  }

  const payload = [
    authUserId, data.name.toUpperCase().trim(), cleanCpf, email, matricula,
    data.phone || null, data.address || null, data.church || null, data.pastor_name || null,
    data.class_id || null, data.payment_status || "paid", data.polo_id || "polo-tancredo-neves",
  ]

  if (existing[0]) {
    const { rows } = await pool.query(
      `update students set
         auth_user_id = $1, name = $2, cpf = $3, email = $4, enrollment_number = $5,
         phone = $6, address = $7, church = $8, pastor_name = $9, class_id = $10::uuid,
         payment_status = $11, polo_id = $12, status = 'active'
       where id = $13::uuid returning id`,
      [...payload, existing[0].id]
    )
    return { studentId: rows[0].id, updated: true }
  }

  const { rows } = await pool.query(
    `insert into students
       (auth_user_id, name, cpf, email, enrollment_number, phone, address, church, pastor_name,
        class_id, payment_status, polo_id, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::uuid,$11,$12,'active') returning id`,
    payload
  )
  return { studentId: rows[0].id, updated: false }
}

// Ativa o aluno e, se ainda não tiver conta, cria uma com senha aleatória.
// A senha só é devolvida nesta resposta, para a secretaria repassar ao aluno.
export async function activateStudent(studentId: string) {
  const { rows } = await pool.query(
    "select id, name, cpf, email, auth_user_id from students where id = $1::uuid", [studentId]
  )
  const student = rows[0]
  if (!student) throw new EnrollmentError("Aluno não encontrado.", 404)

  await pool.query("update students set status = 'active' where id = $1::uuid", [studentId])

  if (student.auth_user_id) {
    return { success: true, alreadyActive: true as const }
  }

  const cleanCpf = (student.cpf || "").replace(/\D/g, "")
  const email = (student.email || `${cleanCpf}@${BRAND.emailDomain}`).toLowerCase()
  const tempPassword = crypto.randomBytes(9).toString("base64url")

  try {
    const created = await auth.api.signUpEmail({ body: { email, password: tempPassword, name: student.name } })
    await pool.query(
      "update students set auth_user_id = $1, email = $2 where id = $3::uuid",
      [created.user.id, email, studentId]
    )
    return { success: true, email, tempPassword }
  } catch (err: any) {
    // E-mail já tem conta (ex.: tentativa anterior): vincula pelo e-mail.
    const { rows: userRows } = await pool.query('select id from "user" where email = $1', [email])
    if (userRows[0]) {
      await pool.query("update students set auth_user_id = $1, email = $2 where id = $3::uuid", [userRows[0].id, email, studentId])
      return { success: true, email, linkedExisting: true as const }
    }
    return { success: true, warning: "Status ativado, mas não foi possível criar o acesso: " + err.message }
  }
}
