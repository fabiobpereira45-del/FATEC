import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listChallenges, createChallenge, updateChallenge, deleteChallenge, countChallengeSubmissions } from "@/lib/repos/challenges"

export async function GET(request: Request) {
  const u = await requireUser(request)
  if ("error" in u) return u.error
  const { searchParams } = new URL(request.url)
  const disciplineId = searchParams.get("disciplineId") || undefined
  return NextResponse.json({ success: true, data: await listChallenges(disciplineId) })
}

export async function POST(request: Request) {
  const u = await requireUser(request, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const data = await request.json().catch(() => null)
  if (!data?.title || !data?.type) return NextResponse.json({ error: "Título e tipo são obrigatórios." }, { status: 400 })
  return NextResponse.json({ success: true, data: await createChallenge(data) })
}

export async function PATCH(request: Request) {
  const u = await requireUser(request, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id, ...data } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
  await updateChallenge(id, data)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const u = await requireUser(request, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

  const subCount = await countChallengeSubmissions(id)
  if (subCount > 0) {
    return NextResponse.json({
      error: `Não é possível excluir esta missão pois ela possui ${subCount} respostas de alunos registradas. Exclua as respostas primeiro ou desative a missão.`
    }, { status: 400 })
  }
  await deleteChallenge(id)
  return NextResponse.json({ success: true })
}
