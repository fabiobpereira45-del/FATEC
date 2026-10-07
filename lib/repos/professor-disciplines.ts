import { pool } from "@/lib/db"

function toLink(r: any) {
  return {
    id: r.id,
    professorId: r.professor_id,
    disciplineId: r.discipline_id,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listProfessorDisciplines(professorId: string) {
  const { rows } = await pool.query(
    "select * from professor_disciplines where professor_id = $1", [professorId]
  )
  return rows.map(toLink)
}

export async function listAllProfessorDisciplines() {
  const { rows } = await pool.query("select * from professor_disciplines")
  return rows.map(toLink)
}

export async function linkProfessorToDiscipline(professorId: string, disciplineId: string) {
  await pool.query(
    `insert into professor_disciplines (professor_id, discipline_id)
     values ($1, $2::uuid) on conflict (professor_id, discipline_id) do nothing`,
    [professorId, disciplineId]
  )
}

export async function unlinkProfessorFromDiscipline(professorId: string, disciplineId: string) {
  await pool.query(
    "delete from professor_disciplines where professor_id = $1 and discipline_id = $2::uuid",
    [professorId, disciplineId]
  )
}

export async function setProfessorFamiliarDisciplines(professorId: string, disciplineIds: string[]) {
  const client = await pool.connect()
  try {
    await client.query("begin")
    await client.query("delete from professor_disciplines where professor_id = $1", [professorId])
    for (const disciplineId of disciplineIds) {
      await client.query(
        "insert into professor_disciplines (professor_id, discipline_id) values ($1, $2::uuid)",
        [professorId, disciplineId]
      )
    }
    await client.query("commit")
  } catch (err) {
    await client.query("rollback")
    throw err
  } finally {
    client.release()
  }
}

export async function listDisciplinesByProfessor(professorId: string) {
  const { rows } = await pool.query(
    `select d.*, s.name as sem_name, s.order_index as sem_order
       from disciplines d
       join professor_disciplines pd on pd.discipline_id = d.id
       left join semesters s on s.id = d.semester_id
      where pd.professor_id = $1`,
    [professorId]
  )
  return rows.map((r: any) => ({
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
  }))
}
