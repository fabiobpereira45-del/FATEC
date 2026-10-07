import { pool } from "@/lib/db"

export interface SemesterInput {
  name: string
  order: number
  shift?: string | null
  modality?: string | null
  poloId?: string | null
  isConcluded?: boolean
}

function toSemester(r: any) {
  return {
    id: r.id,
    name: r.name,
    order: r.order_index,
    shift: r.shift ?? undefined,
    modality: r.modality ?? undefined,
    poloId: r.polo_id ?? null,
    isConcluded: !!r.is_concluded,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listSemesters() {
  const { rows } = await pool.query("select * from semesters order by order_index asc")
  return rows.map(toSemester)
}

export async function createSemester(input: SemesterInput) {
  const { rows } = await pool.query(
    `insert into semesters (name, order_index, shift, modality, polo_id, is_concluded)
     values ($1, $2, $3, $4, $5, false) returning *`,
    [input.name, input.order, input.shift || null, input.modality || "presencial", input.poloId || null]
  )
  return toSemester(rows[0])
}

export async function updateSemester(id: string, data: Partial<SemesterInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.name !== undefined) add("name", data.name)
  if (data.order !== undefined) add("order_index", data.order)
  if (data.shift !== undefined) add("shift", data.shift || null)
  if (data.modality !== undefined) add("modality", data.modality || "presencial")
  if (data.poloId !== undefined) add("polo_id", data.poloId || null)
  if (data.isConcluded !== undefined) add("is_concluded", data.isConcluded)
  if (sets.length === 0) return

  vals.push(id)
  await pool.query(`update semesters set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)

  if (data.poloId !== undefined) {
    await pool.query("update disciplines set polo_id = $1 where semester_id = $2::uuid", [data.poloId || null, id])
  }
}

export async function deleteSemester(id: string) {
  await pool.query("delete from semesters where id = $1::uuid", [id])
}
