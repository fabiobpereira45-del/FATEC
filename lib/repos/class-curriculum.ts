import { pool } from "@/lib/db"

export interface ClassCurriculumInput {
  classId: string
  disciplineId: string
  order: number
  applicationMonth?: string | null
  applicationYear?: string | null
  isConcluded?: boolean
  professorName?: string | null
}

function toItem(r: any) {
  return {
    id: r.id,
    classId: r.class_id,
    disciplineId: r.discipline_id,
    order: r.order_index,
    applicationMonth: r.application_month ?? null,
    applicationYear: r.application_year ?? null,
    isConcluded: !!r.is_concluded,
    professorName: r.professor_name ?? null,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listClassCurriculum(classId: string) {
  const { rows } = await pool.query(
    "select * from class_curriculum where class_id = $1::uuid order by order_index asc",
    [classId]
  )
  return rows.map(toItem)
}

export async function saveClassCurriculumItem(input: ClassCurriculumInput, id?: string) {
  if (id) {
    await pool.query(
      `update class_curriculum
          set class_id = $1::uuid, discipline_id = $2::uuid, order_index = $3,
              application_month = $4, application_year = $5, is_concluded = $6, professor_name = $7
        where id = $8::uuid`,
      [input.classId, input.disciplineId, input.order, input.applicationMonth || null,
       input.applicationYear || null, input.isConcluded || false, input.professorName || null, id]
    )
  } else {
    await pool.query(
      `insert into class_curriculum
         (class_id, discipline_id, order_index, application_month, application_year, is_concluded, professor_name)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)`,
      [input.classId, input.disciplineId, input.order, input.applicationMonth || null,
       input.applicationYear || null, input.isConcluded || false, input.professorName || null]
    )
  }
}

export async function deleteClassCurriculumItem(id: string) {
  await pool.query("delete from class_curriculum where id = $1::uuid", [id])
}

export async function reorderClassCurriculum(orderedItemIds: string[]) {
  for (let i = 0; i < orderedItemIds.length; i++) {
    await pool.query("update class_curriculum set order_index = $1 where id = $2::uuid", [i, orderedItemIds[i]])
  }
}
