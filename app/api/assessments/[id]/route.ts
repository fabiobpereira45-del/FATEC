import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getAssessment, updateAssessment, deleteAssessment } from "@/lib/repos/assessments"
import { triggerN8nWebhook } from "@/lib/n8n"
import { pool } from "@/lib/db"

type Ctx = { params: Promise<{ id: string }> }

// Leitura pública: a prova é respondida sem login (como no sistema anterior).
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params
  const assessment = await getAssessment(id)
  if (!assessment) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 })
  return NextResponse.json(assessment)
}

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  await updateAssessment(id, body)
  if (body.isPublished === true) {
    const assessment = await getAssessment(id)
    if (assessment) {
      const { rows } = await pool.query("select name from disciplines where id = $1::uuid", [assessment.disciplineId])
      triggerN8nWebhook("prova_publicada", {
        type: "assessment",
        assessmentTitle: assessment.title,
        disciplineName: rows[0]?.name || "Disciplina",
        assessmentId: id,
      }).catch(() => {})
    }
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteAssessment(id)
  return NextResponse.json({ success: true })
}
