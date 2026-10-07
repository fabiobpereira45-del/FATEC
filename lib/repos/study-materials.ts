import { pool } from "@/lib/db"

function toMaterial(r: any) {
  return {
    id: r.id,
    disciplineId: r.discipline_id,
    title: r.title,
    description: r.description ?? undefined,
    fileUrl: r.file_url,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listStudyMaterials(disciplineId?: string) {
  const { rows } = disciplineId
    ? await pool.query("select * from study_materials where discipline_id = $1::uuid order by created_at desc", [disciplineId])
    : await pool.query("select * from study_materials order by created_at desc")
  return rows.map(toMaterial)
}

export async function createStudyMaterial(input: { disciplineId: string; title: string; description?: string; fileUrl: string }) {
  const { rows } = await pool.query(
    "insert into study_materials (discipline_id, title, description, file_url) values ($1::uuid,$2,$3,$4) returning *",
    [input.disciplineId, input.title, input.description || null, input.fileUrl]
  )
  return toMaterial(rows[0])
}

export async function deleteStudyMaterial(id: string) {
  const { rows } = await pool.query("select file_url from study_materials where id = $1::uuid", [id])
  await pool.query("delete from study_materials where id = $1::uuid", [id])
  return rows[0]?.file_url as string | undefined
}
