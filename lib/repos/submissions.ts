import { pool } from "@/lib/db"
import { getAssessment } from "@/lib/repos/assessments"
import { triggerN8nWebhook } from "@/lib/n8n"

export interface SubmissionInput {
  id: string
  assessmentId: string
  studentId?: string | null
  studentName: string
  studentEmail: string
  answers: unknown[]
  score: number
  totalPoints: number
  percentage: number
  submittedAt: string
  timeElapsedSeconds: number
  focusLostCount?: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toSubmission(r: any) {
  return {
    id: r.id,
    assessmentId: r.assessment_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentEmail: r.student_email,
    answers: r.answers ?? [],
    score: Number(r.score),
    totalPoints: Number(r.total_points),
    percentage: Number(r.percentage),
    submittedAt: new Date(r.submitted_at).toISOString(),
    timeElapsedSeconds: r.time_elapsed_seconds,
    focusLostCount: r.focus_lost_count || 0,
  }
}

export async function listSubmissions() {
  const { rows } = await pool.query("select * from student_submissions")
  return rows.map(toSubmission)
}

export async function listSubmissionsByAssessment(assessmentId: string) {
  const { rows } = await pool.query(
    "select * from student_submissions where assessment_id = $1::uuid", [assessmentId]
  )
  return rows.map(toSubmission)
}

export async function listSubmissionsByStudent(studentId: string) {
  const { rows } = await pool.query(
    "select * from student_submissions where student_id = $1::uuid", [studentId]
  )
  return rows.map(toSubmission)
}

export async function getSubmissionByEmail(email: string, assessmentId: string) {
  const { rows } = await pool.query(
    "select * from student_submissions where assessment_id = $1::uuid and student_email = $2",
    [assessmentId, email]
  )
  return rows[0] ? toSubmission(rows[0]) : null
}

export async function hasStudentSubmitted(email: string, assessmentId: string) {
  const { rows } = await pool.query(
    "select 1 from student_submissions where assessment_id = $1::uuid and student_email = $2 limit 1",
    [assessmentId, email]
  )
  return rows.length > 0
}

export async function createSubmission(sub: SubmissionInput) {
  const studentId = UUID_RE.test(sub.studentId || "") ? sub.studentId : null
  const { rows } = await pool.query(
    `insert into student_submissions
       (id, assessment_id, student_id, student_name, student_email, answers, score,
        total_points, percentage, submitted_at, time_elapsed_seconds, focus_lost_count)
     values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning *`,
    [sub.id, sub.assessmentId, studentId, sub.studentName, sub.studentEmail,
     JSON.stringify(sub.answers || []), sub.score, sub.totalPoints, sub.percentage,
     sub.submittedAt, sub.timeElapsedSeconds, sub.focusLostCount || 0]
  )
  const result = toSubmission(rows[0])

  // Migra a nota da prova para o boletim (oculta até o professor liberar).
  try {
    const { rows: studentRows } = await pool.query(
      "select name from students where email = $1", [sub.studentEmail]
    )
    if (studentRows[0]) {
      const assessment = await getAssessment(sub.assessmentId)
      const disciplineId = assessment?.disciplineId || null
      const { rows: existing } = await pool.query(
        "select id from student_grades where student_identifier = $1 and discipline_id = $2::uuid",
        [sub.studentEmail, disciplineId]
      )
      if (existing[0]) {
        await pool.query(
          `update student_grades
              set student_name = $1, discipline_id = $2::uuid, exam_grade = $3, is_public = false
            where id = $4::uuid`,
          [sub.studentName, disciplineId, sub.score, existing[0].id]
        )
      } else {
        await pool.query(
          `insert into student_grades (student_identifier, student_name, discipline_id, exam_grade, is_public)
           values ($1, $2, $3::uuid, $4, false)`,
          [sub.studentEmail, sub.studentName, disciplineId, sub.score]
        )
      }
    }
  } catch (err) {
    console.error("Erro ao migrar nota da prova para o boletim:", err)
  }

  try {
    const assessment = await getAssessment(sub.assessmentId)
    if (assessment) {
      await triggerN8nWebhook("prova_concluida", {
        type: "exam_completion",
        name: sub.studentName,
        phone: sub.studentEmail.split("@")[0],
        title: assessment.title,
        score: sub.score,
        totalPoints: sub.totalPoints,
      })
    }
  } catch (err) {
    console.error("Erro ao disparar WhatsApp n8n de conclusão de prova:", err)
  }

  return result
}

export async function updateSubmissionScore(id: string, score: number, totalPoints: number) {
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
  await pool.query(
    "update student_submissions set score = $1, percentage = $2 where id = $3::uuid",
    [score, percentage, id]
  )
}

export async function deleteSubmission(id: string) {
  await pool.query("delete from student_submissions where id = $1::uuid", [id])
}
