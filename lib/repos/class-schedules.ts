import { pool } from "@/lib/db"

export interface ClassScheduleInput {
  classId: string
  disciplineId: string
  professorName?: string | null
  dayOfWeek?: string | null
  timeStart?: string | null
  timeEnd?: string | null
  lessonsCount?: number
  workload?: number
  startDate?: string | null
  endDate?: string | null
}

function toSchedule(r: any) {
  return {
    id: r.id,
    classId: r.class_id,
    disciplineId: r.discipline_id,
    professorName: r.professor_name,
    dayOfWeek: r.day_of_week,
    timeStart: r.time_start,
    timeEnd: r.time_end,
    lessonsCount: Number(r.lessons_count || 1),
    workload: Number(r.workload || 0),
    startDate: r.start_date ? new Date(r.start_date).toISOString().split("T")[0] : undefined,
    endDate: r.end_date ? new Date(r.end_date).toISOString().split("T")[0] : undefined,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listClassSchedules() {
  const { rows } = await pool.query("select * from class_schedules order by day_of_week asc")
  return rows.map(toSchedule)
}

export async function createClassSchedule(input: ClassScheduleInput) {
  const { rows } = await pool.query(
    `insert into class_schedules
       (class_id, discipline_id, professor_name, day_of_week, time_start, time_end,
        lessons_count, workload, start_date, end_date)
     values ($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [input.classId, input.disciplineId, input.professorName || null, input.dayOfWeek || null,
     input.timeStart || null, input.timeEnd || null, input.lessonsCount ?? 1, input.workload ?? 0,
     input.startDate || null, input.endDate || null]
  )
  return toSchedule(rows[0])
}

export async function updateClassSchedule(id: string, data: Partial<ClassScheduleInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.classId !== undefined) add("class_id", data.classId)
  if (data.disciplineId !== undefined) add("discipline_id", data.disciplineId)
  if (data.professorName !== undefined) add("professor_name", data.professorName)
  if (data.dayOfWeek !== undefined) add("day_of_week", data.dayOfWeek)
  if (data.timeStart !== undefined) add("time_start", data.timeStart)
  if (data.timeEnd !== undefined) add("time_end", data.timeEnd)
  if (data.lessonsCount !== undefined) add("lessons_count", data.lessonsCount)
  if (data.workload !== undefined) add("workload", data.workload)
  if (data.startDate !== undefined) add("start_date", data.startDate || null)
  if (data.endDate !== undefined) add("end_date", data.endDate || null)
  if (sets.length === 0) return
  vals.push(id)
  await pool.query(`update class_schedules set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteClassSchedule(id: string) {
  await pool.query("delete from class_schedules where id = $1::uuid", [id])
}
