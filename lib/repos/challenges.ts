import { pool } from "@/lib/db"

// Linhas cruas (snake_case): o mapeamento para camelCase já é feito no
// cliente por mapChallenge/mapChallengeSubmission em lib/store.ts.

export async function listChallenges(disciplineId?: string) {
  const { rows } = disciplineId
    ? await pool.query("select * from challenges where discipline_id = $1::uuid order by week asc", [disciplineId])
    : await pool.query("select * from challenges order by week asc")
  return rows
}

export async function createChallenge(data: any) {
  const { rows } = await pool.query(
    `insert into challenges (discipline_id, week, title, description, type, content, correct_answer, points, is_active)
     values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [data.discipline_id || null, data.week, data.title, data.description || "", data.type,
     JSON.stringify(data.content ?? null), data.correct_answer || null, data.points ?? 0, data.is_active ?? true]
  )
  return rows[0]
}

export async function updateChallenge(id: string, data: any) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.discipline_id !== undefined) add("discipline_id", data.discipline_id)
  if (data.week !== undefined) add("week", data.week)
  if (data.title !== undefined) add("title", data.title)
  if (data.description !== undefined) add("description", data.description)
  if (data.type !== undefined) add("type", data.type)
  if (data.content !== undefined) add("content", JSON.stringify(data.content))
  if (data.correct_answer !== undefined) add("correct_answer", data.correct_answer)
  if (data.points !== undefined) add("points", data.points)
  if (data.is_active !== undefined) add("is_active", data.is_active)
  if (sets.length === 0) return
  vals.push(id)
  await pool.query(`update challenges set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function countChallengeSubmissions(challengeId: string) {
  const { rows } = await pool.query("select count(*)::int as n from challenge_submissions where challenge_id = $1::uuid", [challengeId])
  return rows[0].n as number
}

export async function deleteChallenge(id: string) {
  await pool.query("delete from challenges where id = $1::uuid", [id])
}

export async function listChallengeSubmissions(filter: { studentId?: string; challengeId?: string }) {
  if (filter.studentId) {
    const { rows } = await pool.query("select * from challenge_submissions where student_id = $1::uuid", [filter.studentId])
    return rows
  }
  const { rows } = await pool.query("select * from challenge_submissions where challenge_id = $1::uuid", [filter.challengeId])
  return rows
}

export async function createChallengeSubmission(data: any) {
  await pool.query(
    `insert into challenge_submissions (challenge_id, student_id, answer, is_correct, earned_points)
     values ($1::uuid,$2::uuid,$3,$4,$5)`,
    [data.challenge_id, data.student_id, data.answer, !!data.is_correct, data.earned_points ?? 0]
  )
}

export async function deleteChallengeSubmission(id: string) {
  await pool.query("delete from challenge_submissions where id = $1::uuid", [id])
}

export async function deleteChallengeSubmissionsByChallenge(challengeId: string) {
  await pool.query("delete from challenge_submissions where challenge_id = $1::uuid", [challengeId])
}
