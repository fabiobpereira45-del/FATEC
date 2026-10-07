import { pool } from "@/lib/db"
import { activateStudent } from "@/lib/repos/enrollment"

export interface StudentUpdateInput {
  name?: string
  cpf?: string
  phone?: string
  address?: string
  church?: string
  pastor_name?: string
  class_id?: string | null
  payment_status?: string
  status?: "pending" | "active" | "inactive"
  avatar_url?: string | null
  bio?: string | null
}

function toStudent(r: any) {
  return {
    id: r.id,
    auth_user_id: r.auth_user_id,
    name: r.name,
    email: r.email,
    cpf: r.cpf,
    enrollment_number: r.enrollment_number,
    phone: r.phone ?? undefined,
    address: r.address ?? undefined,
    church: r.church ?? undefined,
    pastor_name: r.pastor_name ?? undefined,
    class_id: r.class_id ?? undefined,
    payment_status: r.payment_status ?? undefined,
    avatar_url: r.avatar_url ?? null,
    bio: r.bio ?? null,
    status: r.status,
    created_at: new Date(r.created_at).toISOString(),
    polo_id: r.polo_id ?? undefined,
    modality: r.modality ?? undefined,
  }
}

export async function listStudents() {
  const { rows } = await pool.query("select * from students order by name asc")
  return rows.map(toStudent)
}

export async function getStudent(id: string) {
  const { rows } = await pool.query("select * from students where id = $1::uuid", [id])
  return rows[0] ? toStudent(rows[0]) : null
}

// Usado pela sessão do aluno: busca pelo id de usuário do Better Auth, com
// religação automática por e-mail/CPF se o vínculo ainda não existir.
export async function getStudentByAuthUserId(authUserId: string, email?: string | null) {
  const { rows } = await pool.query("select * from students where auth_user_id = $1", [authUserId])
  if (rows[0]) return toStudent(rows[0])

  if (email) {
    const cleanCpf = email.includes("@") ? email.split("@")[0].replace(/\D/g, "") : ""
    const { rows: byEmail } = await pool.query(
      "select * from students where lower(email) = lower($1) or ($2 <> '' and cpf = $2) limit 1",
      [email, cleanCpf]
    )
    if (byEmail[0]) {
      pool.query("update students set auth_user_id = $1 where id = $2", [authUserId, byEmail[0].id]).catch(() => {})
      return toStudent(byEmail[0])
    }
  }
  return null
}

export async function listClassmates(classId: string) {
  const { rows } = await pool.query(
    "select * from students where class_id = $1::uuid and status = 'active' order by name", [classId]
  )
  return rows.map(toStudent)
}

export async function updateStudent(id: string, data: StudentUpdateInput) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.name !== undefined) add("name", data.name.toUpperCase().trim())
  if (data.cpf !== undefined) add("cpf", data.cpf.replace(/\D/g, ""))
  if (data.phone !== undefined) add("phone", data.phone || null)
  if (data.address !== undefined) add("address", data.address || null)
  if (data.church !== undefined) add("church", data.church || null)
  if (data.pastor_name !== undefined) add("pastor_name", data.pastor_name || null)
  if (data.class_id !== undefined) add("class_id", data.class_id || null)
  if (data.payment_status !== undefined) add("payment_status", data.payment_status || null)
  if (data.status !== undefined) add("status", data.status)
  if (data.avatar_url !== undefined) add("avatar_url", data.avatar_url || null)
  if (data.bio !== undefined) add("bio", data.bio || null)
  if (sets.length > 0) {
    vals.push(id)
    await pool.query(`update students set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
  }

  if (data.payment_status === "paid") {
    await activateStudent(id).catch(e => console.error("Manual activation trigger error:", e))
  }
}

export async function deleteStudent(id: string) {
  await pool.query("delete from students where id = $1::uuid", [id])
}
