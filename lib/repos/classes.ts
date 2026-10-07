import { pool } from "@/lib/db"

export interface ClassInput {
  name: string
  shift: "morning" | "afternoon" | "evening" | "ead"
  dayOfWeek?: string | null
  maxStudents: number
  poloId?: string | null
  modality?: "presencial" | "semi_presencial" | "online" | null
}

function toClass(r: any) {
  return {
    id: r.id,
    name: r.name,
    shift: r.shift,
    dayOfWeek: r.day_of_week || undefined,
    maxStudents: Number(r.max_students),
    studentCount: Number(r.student_count || 0),
    createdAt: new Date(r.created_at).toISOString(),
    poloId: r.polo_id || undefined,
    modality: r.modality || undefined,
  }
}

export async function listClasses(poloId?: string) {
  const where = poloId && poloId !== "all" ? "where c.polo_id = $1" : ""
  const sql = `
    select c.*, count(s.id)::int as student_count
      from classes c
      left join students s on s.class_id = c.id
      ${where}
     group by c.id`
  const { rows } = await pool.query(sql, where ? [poloId] : [])
  return rows.map(toClass)
}

export async function createClass(input: ClassInput) {
  const { rows } = await pool.query(
    `insert into classes (name, shift, day_of_week, max_students, polo_id, modality)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [input.name, input.shift, input.dayOfWeek || null, input.maxStudents, input.poloId || null, input.modality || null]
  )
  return toClass({ ...rows[0], student_count: 0 })
}

export async function updateClass(id: string, data: Partial<ClassInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.name !== undefined) add("name", data.name)
  if (data.shift !== undefined) add("shift", data.shift)
  if (data.maxStudents !== undefined) add("max_students", data.maxStudents)
  if (data.dayOfWeek !== undefined) add("day_of_week", data.dayOfWeek || null)
  if (data.poloId !== undefined) add("polo_id", data.poloId || null)
  if (data.modality !== undefined) add("modality", data.modality || null)
  if (sets.length === 0) return

  vals.push(id)
  await pool.query(`update classes set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteClass(id: string) {
  await pool.query("delete from classes where id = $1::uuid", [id])
}
