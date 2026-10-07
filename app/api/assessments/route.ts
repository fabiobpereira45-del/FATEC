import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listAssessments, createAssessment } from "@/lib/repos/assessments"
import { triggerN8nWebhook } from "@/lib/n8n"
import { pool } from "@/lib/db"

// Leitura pública: a prova é respondida sem login (como no sistema anterior).
export async function GET() {
  return NextResponse.json(await listAssessments())
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.disciplineId) {
    return NextResponse.json({ error: "Título e disciplina são obrigatórios." }, { status: 400 })
  }
  const created = await createAssessment(body)
  if (created.isPublished) {
    const { rows } = await pool.query("select name from disciplines where id = $1::uuid", [created.disciplineId])
    triggerN8nWebhook("prova_publicada", {
      type: "assessment",
      assessmentTitle: created.title,
      disciplineName: rows[0]?.name || "Disciplina",
      assessmentId: created.id,
    }).catch(() => {})
  }
  return NextResponse.json(created, { status: 201 })
}
