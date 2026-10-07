import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listQuestions, createQuestion } from "@/lib/repos/questions"

// Leitura pública: a prova é respondida sem login (como no sistema anterior).
// Atenção: isso expõe a resposta correta a quem inspecionar a rede. É um
// comportamento herdado, não introduzido nesta migração — vale corrigir depois.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const disciplineId = searchParams.get("disciplineId") || undefined
  return NextResponse.json(await listQuestions(disciplineId))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.disciplineId || !body?.text) {
    return NextResponse.json({ error: "Disciplina e enunciado são obrigatórios." }, { status: 400 })
  }
  return NextResponse.json(await createQuestion(body), { status: 201 })
}
