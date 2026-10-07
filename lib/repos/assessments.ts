import { pool } from "@/lib/db"

export interface AssessmentInput {
  title: string
  disciplineId: string
  professor?: string | null
  institution?: string | null
  questionIds: string[]
  pointsPerQuestion: number
  totalPoints: number
  openAt?: string | null
  closeAt?: string | null
  isPublished?: boolean
  archived?: boolean
  shuffleVariants?: boolean
  timeLimitMinutes?: number | null
  logoBase64?: string | null
  rules?: string | null
  releaseResults?: boolean
  modality?: "public" | "private"
  isFinalExam?: boolean
}

function toAssessment(r: any) {
  return {
    id: r.id,
    title: r.title,
    disciplineId: r.discipline_id,
    professor: r.professor,
    institution: r.institution,
    questionIds: r.question_ids ?? [],
    pointsPerQuestion: Number(r.points_per_question),
    totalPoints: Number(r.total_points),
    openAt: r.open_at ? new Date(r.open_at).toISOString() : null,
    closeAt: r.close_at ? new Date(r.close_at).toISOString() : null,
    isPublished: !!r.is_published,
    archived: !!r.archived,
    shuffleVariants: !!r.shuffle_variants,
    timeLimitMinutes: r.time_limit_minutes,
    logoBase64: r.logo_base64,
    rules: r.rules,
    releaseResults: !!r.release_results,
    modality: r.modality,
    isFinalExam: !!r.is_final_exam,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listAssessments() {
  const { rows } = await pool.query("select * from assessments order by created_at desc")
  return rows.map(toAssessment)
}

export async function getAssessment(id: string) {
  const { rows } = await pool.query("select * from assessments where id = $1::uuid", [id])
  return rows[0] ? toAssessment(rows[0]) : null
}

export async function createAssessment(input: AssessmentInput) {
  const { rows } = await pool.query(
    `insert into assessments
       (title, discipline_id, professor, institution, question_ids, points_per_question, total_points,
        open_at, close_at, is_published, shuffle_variants, time_limit_minutes, logo_base64, rules,
        release_results, modality, is_final_exam, archived)
     values ($1,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,$15,$16,false)
     returning *`,
    [
      input.title, input.disciplineId, input.professor || null, input.institution || null,
      JSON.stringify(input.questionIds || []), input.pointsPerQuestion, input.totalPoints,
      input.openAt || null, input.closeAt || null, input.isPublished || false,
      input.shuffleVariants || false, input.timeLimitMinutes || null, input.logoBase64 || null,
      input.rules || null, input.modality || "public", input.isFinalExam || false,
    ]
  )
  return toAssessment(rows[0])
}

export async function updateAssessment(id: string, data: Partial<AssessmentInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.title !== undefined) add("title", data.title)
  if (data.disciplineId !== undefined) add("discipline_id", data.disciplineId)
  if (data.professor !== undefined) add("professor", data.professor)
  if (data.institution !== undefined) add("institution", data.institution)
  if (data.questionIds !== undefined) add("question_ids", JSON.stringify(data.questionIds))
  if (data.pointsPerQuestion !== undefined) add("points_per_question", data.pointsPerQuestion)
  if (data.totalPoints !== undefined) add("total_points", data.totalPoints)
  if (data.openAt !== undefined) add("open_at", data.openAt)
  if (data.closeAt !== undefined) add("close_at", data.closeAt)
  if (data.isPublished !== undefined) add("is_published", data.isPublished)
  if (data.archived !== undefined) add("archived", data.archived)
  if (data.shuffleVariants !== undefined) add("shuffle_variants", data.shuffleVariants)
  if (data.logoBase64 !== undefined) add("logo_base64", data.logoBase64)
  if (data.rules !== undefined) add("rules", data.rules)
  if (data.releaseResults !== undefined) add("release_results", data.releaseResults)
  if (data.modality !== undefined) add("modality", data.modality)
  if (data.timeLimitMinutes !== undefined) add("time_limit_minutes", data.timeLimitMinutes)
  if (data.isFinalExam !== undefined) add("is_final_exam", data.isFinalExam)
  if (sets.length === 0) return

  vals.push(id)
  await pool.query(`update assessments set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteAssessment(id: string) {
  await pool.query("delete from assessments where id = $1::uuid", [id])
}
