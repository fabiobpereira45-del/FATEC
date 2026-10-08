import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { listSubmissions, listSubmissionsByAssessment, listSubmissionsByStudent, createSubmission } from "@/lib/repos/submissions"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const assessmentId = searchParams.get("assessmentId")
  const studentId = searchParams.get("studentId")

  if (studentId) {
    if (u.role === "student" && !(await isOwnStudent(u.user.id, studentId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    return NextResponse.json(await listSubmissionsByStudent(studentId))
  }
  if (u.role === "student") return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  return NextResponse.json(assessmentId ? await listSubmissionsByAssessment(assessmentId) : await listSubmissions())
}

// Criação pública: a prova é enviada sem login (como no sistema anterior).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.id || !body?.assessmentId || !body?.studentEmail) {
    return NextResponse.json({ error: "Dados da submissão incompletos." }, { status: 400 })
  }
  return NextResponse.json(await createSubmission(body), { status: 201 })
}
