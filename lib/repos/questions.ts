import { pool } from "@/lib/db"

export interface QuestionInput {
  disciplineId: string
  type: string
  text: string
  choices?: unknown[]
  pairs?: unknown[]
  correctAnswer: string
  points: number
}

function toQuestion(r: any) {
  return {
    id: r.id,
    disciplineId: r.discipline_id,
    type: r.type,
    text: r.text,
    choices: r.choices ?? [],
    pairs: r.pairs ?? undefined,
    correctAnswer: r.correct_answer,
    points: Number(r.points),
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listQuestions(disciplineId?: string) {
  const { rows } = disciplineId
    ? await pool.query("select * from questions where discipline_id = $1::uuid", [disciplineId])
    : await pool.query("select * from questions")
  return rows.map(toQuestion)
}

export async function questionCounts() {
  const { rows } = await pool.query("select discipline_id, count(*)::int as n from questions group by discipline_id")
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.discipline_id] = r.n
  return counts
}

export async function createQuestion(input: QuestionInput) {
  const { rows } = await pool.query(
    `insert into questions (discipline_id, type, text, choices, pairs, correct_answer, points)
     values ($1::uuid, $2, $3, $4, $5, $6, $7) returning *`,
    [input.disciplineId, input.type, input.text, JSON.stringify(input.choices || []),
     input.pairs?.length ? JSON.stringify(input.pairs) : null, input.correctAnswer, input.points]
  )
  return toQuestion(rows[0])
}

export async function createQuestionsBatch(inputs: QuestionInput[]) {
  const ids: string[] = []
  for (const q of inputs) {
    const created = await createQuestion(q)
    ids.push(created.id)
  }
  return ids
}

export async function updateQuestion(id: string, data: Partial<QuestionInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.disciplineId !== undefined) add("discipline_id", data.disciplineId)
  if (data.type !== undefined) add("type", data.type)
  if (data.text !== undefined) add("text", data.text)
  if (data.points !== undefined) add("points", data.points)
  if (data.correctAnswer !== undefined) add("correct_answer", data.correctAnswer)
  if (data.choices !== undefined) add("choices", JSON.stringify(data.choices || []))
  if (data.pairs !== undefined) add("pairs", data.pairs?.length ? JSON.stringify(data.pairs) : null)
  if (sets.length === 0) return

  vals.push(id)
  await pool.query(`update questions set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteQuestion(id: string) {
  await pool.query("delete from questions where id = $1::uuid", [id])
}
