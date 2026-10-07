import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"

export interface ProfessorInput {
  name: string
  email: string
  role: "master" | "professor" | "secretary"
  password?: string
  active?: boolean
  bio?: string | null
  avatar_url?: string | null
}

const BASE = `
  select u.id, u.name, u.email, p.role, p.avatar_url, p.bio, p.active, p.created_at
    from professor_accounts p
    join "user" u on u.id = p.id`

function toProfessor(r: any) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    passwordHash: "", // a senha é gerenciada pelo Better Auth, não por esta tabela
    role: r.role,
    avatar_url: r.avatar_url ?? null,
    bio: r.bio ?? null,
    active: r.active,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listProfessors() {
  const { rows } = await pool.query(BASE)
  return rows.map(toProfessor)
}

export async function getProfessorById(id: string) {
  const { rows } = await pool.query(`${BASE} where u.id = $1`, [id])
  return rows[0] ? toProfessor(rows[0]) : null
}

export async function getProfessorByEmail(email: string) {
  const { rows } = await pool.query(`${BASE} where lower(u.email) = lower($1)`, [email])
  return rows[0] ? toProfessor(rows[0]) : null
}

export async function createProfessor(input: ProfessorInput) {
  if (!input.password || input.password.length < 8) {
    throw new Error("A senha deve ter ao menos 8 caracteres.")
  }
  const email = input.email.toLowerCase().trim()
  const created = await auth.api.signUpEmail({
    body: { email, password: input.password, name: input.name.toUpperCase().trim() },
  })
  await pool.query('update "user" set role = $1, "emailVerified" = true where id = $2', [input.role, created.user.id])
  await pool.query(
    'insert into professor_accounts (id, role, active) values ($1, $2, true)',
    [created.user.id, input.role]
  )
  return getProfessorById(created.user.id)
}

export async function updateProfessor(id: string, data: Partial<ProfessorInput>) {
  if (data.name !== undefined || data.email !== undefined) {
    const sets: string[] = []
    const vals: unknown[] = []
    const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
    if (data.name !== undefined) add("name", data.name.toUpperCase().trim())
    if (data.email !== undefined) add("email", data.email.toLowerCase().trim())
    vals.push(id)
    await pool.query(`update "user" set ${sets.join(", ")} where id = $${vals.length}`, vals)
  }

  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.role !== undefined) add("role", data.role)
  if (data.active !== undefined) add("active", data.active)
  if (data.bio !== undefined) add("bio", data.bio)
  if (data.avatar_url !== undefined) add("avatar_url", data.avatar_url)
  if (sets.length > 0) {
    vals.push(id)
    await pool.query(`update professor_accounts set ${sets.join(", ")} where id = $${vals.length}`, vals)
  }
  if (data.role !== undefined) {
    await pool.query('update "user" set role = $1 where id = $2', [data.role, id])
  }
  return getProfessorById(id)
}

export async function deleteProfessor(id: string) {
  await pool.query("delete from professor_accounts where id = $1", [id])
  await pool.query('delete from "user" where id = $1', [id])
}
