import { pool } from "@/lib/db"

export interface DisciplineInput {
  name: string
  description?: string | null
  semesterId?: string | null
  professorName?: string | null
  dayOfWeek?: string | null
  shift?: string | null
  order?: number
  applicationMonth?: string | null
  applicationYear?: string | null
  isConcluded?: boolean
}

const BASE = `
  select d.*, s.name as sem_name, s.order_index as sem_order
    from disciplines d
    left join semesters s on s.id = d.semester_id`

function toDiscipline(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    semesterId: r.semester_id ?? null,
    semesterOrder: r.sem_order ?? 999,
    semesterName: r.sem_name ?? "",
    poloId: r.polo_id ?? null,
    professorName: r.professor_name ?? null,
    dayOfWeek: r.day_of_week ?? null,
    shift: r.shift ?? null,
    order: r.order_index ?? 0,
    applicationMonth: r.application_month ?? null,
    applicationYear: r.application_year ?? null,
    isConcluded: !!r.is_concluded,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listDisciplines() {
  const { rows } = await pool.query(BASE)
  return rows.map(toDiscipline).sort((a, b) =>
    (a.semesterOrder - b.semesterOrder) ||
    (a.order - b.order) ||
    (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  )
}

export async function getDiscipline(id: string) {
  const { rows } = await pool.query(`${BASE} where d.id = $1::uuid`, [id])
  return rows[0] ? toDiscipline(rows[0]) : null
}

export async function createDiscipline(input: DisciplineInput) {
  const { rows } = await pool.query(
    `insert into disciplines
       (name, description, semester_id, polo_id, professor_name, day_of_week, shift,
        order_index, application_month, application_year, is_concluded)
     values ($1, $2, $3::uuid, (select polo_id from semesters where id = $3::uuid), $4, $5, $6, $7, $8, $9, $10)
     returning id`,
    [
      input.name,
      input.description || null,
      input.semesterId || null,
      input.professorName || null,
      input.dayOfWeek || null,
      input.shift || null,
      input.order || 0,
      input.applicationMonth || null,
      input.applicationYear || null,
      input.isConcluded || false,
    ]
  )
  return getDiscipline(rows[0].id)
}

const MONTHS: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6,
  Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12,
}

// Mantém a mensalidade alinhada com o nome e o mês/ano da disciplina.
async function syncMonthlyCharges(id: string, name: string | null, month: string | null, year: string | null) {
  if (!month || !year) return
  const monthNum = MONTHS[month] ?? (parseInt(month) || 1)
  const due = new Date(parseInt(year), monthNum - 1, 10).toISOString().split("T")[0]
  await pool.query(
    `update financial_charges
        set due_date = $1::date,
            description = case when $2::text is null then description else 'Mensalidade: ' || $2::text end
      where discipline_id = $3::uuid and type = 'monthly'`,
    [due, name, id]
  )
}

export async function updateDiscipline(id: string, data: Partial<DisciplineInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, value: unknown) => {
    vals.push(value)
    sets.push(`${col} = $${vals.length}`)
  }

  if (data.name !== undefined) add("name", data.name)
  if (data.description !== undefined) add("description", data.description || null)
  if (data.semesterId !== undefined) {
    add("semester_id", data.semesterId || null)
    vals.push(data.semesterId || null)
    sets.push(`polo_id = (select polo_id from semesters where id = $${vals.length}::uuid)`)
  }
  if (data.professorName !== undefined) add("professor_name", data.professorName || null)
  if (data.dayOfWeek !== undefined) add("day_of_week", data.dayOfWeek || null)
  if (data.shift !== undefined) add("shift", data.shift || null)
  if (data.order !== undefined) add("order_index", data.order)
  if (data.applicationMonth !== undefined) add("application_month", data.applicationMonth || null)
  if (data.applicationYear !== undefined) add("application_year", data.applicationYear || null)
  if (data.isConcluded !== undefined) add("is_concluded", data.isConcluded)

  if (sets.length > 0) {
    vals.push(id)
    const res = await pool.query(`update disciplines set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
    if (res.rowCount === 0) throw new Error("Disciplina não encontrada.")
  }

  const financialRelevant = data.name !== undefined || data.applicationMonth !== undefined || data.applicationYear !== undefined
  if (financialRelevant) {
    const current = await getDiscipline(id)
    if (current) {
      await syncMonthlyCharges(
        id,
        data.name !== undefined ? data.name : current.name,
        data.applicationMonth !== undefined ? data.applicationMonth : current.applicationMonth,
        data.applicationYear !== undefined ? data.applicationYear : current.applicationYear,
      )
    }
  }
}

export async function reorderDisciplines(items: { id: string; order: number }[]) {
  for (const item of items) {
    await pool.query("update disciplines set order_index = $1 where id = $2::uuid", [item.order, item.id])
  }
}

export async function deleteDiscipline(id: string) {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query("delete from financial_charges where discipline_id = $1::uuid", [id])
    await client.query("delete from disciplines where id = $1::uuid", [id])
    await client.query("commit")
  } catch (err) {
    await client.query("rollback")
    throw err
  } finally {
    client.release()
  }
}
