import { pool } from "@/lib/db"

export interface GradeInput {
  studentId?: string | null
  studentIdentifier: string
  studentName: string
  disciplineId?: string | null
  isPublic: boolean
  examGrade: number
  worksGrade: number
  seminarGrade: number
  participationBonus: number
  attendanceScore: number
  customDivisor: number
}

export interface GradeSettingsInput {
  examWeight: number
  testWeight: number
  workWeight: number
  bonusWeight: number
  presenceValue: number
  divisor: number
}

function toGrade(r: any) {
  return {
    id: r.id,
    studentId: r.student_id ?? undefined,
    student_id: r.student_id ?? undefined,
    studentIdentifier: r.student_identifier,
    studentName: r.student_name,
    disciplineId: r.discipline_id ?? undefined,
    isPublic: !!r.is_public,
    examGrade: Number(r.exam_grade),
    worksGrade: Number(r.works_grade),
    seminarGrade: Number(r.seminar_grade),
    participationBonus: Number(r.participation_bonus),
    attendanceScore: Number(r.attendance_score),
    customDivisor: Number(r.custom_divisor),
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listStudentGrades() {
  const { rows } = await pool.query(
    "select * from student_grades order by created_at desc limit 500"
  )
  return rows.map(toGrade)
}

export async function saveStudentGrade(grade: GradeInput, id?: string) {
  let studentId = grade.studentId || null
  if (!studentId && grade.studentIdentifier) {
    const cleanId = grade.studentIdentifier.replace(/\D/g, "")
    const { rows } = await pool.query(
      "select id from students where cpf = $1 or email = $2 or enrollment_number = $3 limit 1",
      [cleanId, grade.studentIdentifier, grade.studentIdentifier]
    )
    if (rows[0]) studentId = rows[0].id
  }

  const vals = [
    studentId, grade.studentIdentifier, grade.studentName, grade.disciplineId || null,
    grade.isPublic, grade.examGrade, grade.worksGrade, grade.seminarGrade,
    grade.participationBonus, grade.attendanceScore, grade.customDivisor,
  ]

  if (id) {
    await pool.query(
      `update student_grades set
         student_id = $1::uuid, student_identifier = $2, student_name = $3, discipline_id = $4::uuid,
         is_public = $5, exam_grade = $6, works_grade = $7, seminar_grade = $8,
         participation_bonus = $9, attendance_score = $10, custom_divisor = $11
       where id = $12::uuid`,
      [...vals, id]
    )
  } else {
    await pool.query(
      `insert into student_grades
         (student_id, student_identifier, student_name, discipline_id, is_public, exam_grade,
          works_grade, seminar_grade, participation_bonus, attendance_score, custom_divisor)
       values ($1::uuid, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11)`,
      vals
    )
  }
}

export async function deleteStudentGrade(id: string) {
  await pool.query("delete from student_grades where id = $1::uuid", [id])
}

const DEFAULT_SETTINGS: GradeSettingsInput & { updatedAt: string } = {
  examWeight: 10, testWeight: 0, workWeight: 0, bonusWeight: 0,
  presenceValue: 0.5, divisor: 2, updatedAt: new Date().toISOString(),
}

export async function getGradeSettings() {
  const { rows } = await pool.query("select * from grade_settings where id = 'global'")
  const r = rows[0]
  if (!r) return DEFAULT_SETTINGS
  return {
    examWeight: Number(r.exam_weight ?? 10),
    testWeight: Number(r.test_weight ?? 0),
    workWeight: Number(r.work_weight ?? 0),
    bonusWeight: Number(r.bonus_weight ?? 0),
    presenceValue: Number(r.presence_value ?? 0.5),
    divisor: Number(r.divisor ?? 2),
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export async function saveGradeSettings(settings: GradeSettingsInput) {
  await pool.query(
    `insert into grade_settings (id, exam_weight, test_weight, work_weight, bonus_weight, presence_value, divisor, updated_at)
     values ('global', $1, $2, $3, $4, $5, $6, now())
     on conflict (id) do update set
       exam_weight = excluded.exam_weight, test_weight = excluded.test_weight,
       work_weight = excluded.work_weight, bonus_weight = excluded.bonus_weight,
       presence_value = excluded.presence_value, divisor = excluded.divisor, updated_at = now()`,
    [settings.examWeight, settings.testWeight, settings.workWeight, settings.bonusWeight,
     settings.presenceValue, settings.divisor]
  )
}

async function classIdentifiers(classId: string) {
  const { rows } = await pool.query(
    "select cpf, enrollment_number, email from students where class_id = $1::uuid", [classId]
  )
  const ids = new Set<string>()
  for (const s of rows) {
    if (s.cpf) ids.add(String(s.cpf).replace(/\D/g, ""))
    if (s.enrollment_number) ids.add(s.enrollment_number)
    if (s.email) ids.add(String(s.email).toLowerCase().trim())
  }
  return Array.from(ids)
}

export async function releaseAllGrades(classId?: string) {
  if (classId && classId !== "all") {
    const ids = await classIdentifiers(classId)
    if (ids.length > 0) {
      await pool.query("update student_grades set is_public = true where student_identifier = any($1)", [ids])
    }
  } else {
    await pool.query("update student_grades set is_public = true")
  }
}

export async function blockAllGrades(classId?: string) {
  if (classId && classId !== "all") {
    const ids = await classIdentifiers(classId)
    if (ids.length > 0) {
      await pool.query("update student_grades set is_public = false where student_identifier = any($1)", [ids])
    }
  } else {
    await pool.query("update student_grades set is_public = false")
  }
}
