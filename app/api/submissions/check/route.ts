import { NextResponse } from "next/server"
import { hasStudentSubmitted, getSubmissionByEmail } from "@/lib/repos/submissions"

// Pública: usada pela tela de prova antes do login do aluno.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const assessmentId = searchParams.get("assessmentId")
  if (!email || !assessmentId) {
    return NextResponse.json({ error: "Informe email e assessmentId." }, { status: 400 })
  }
  const found = searchParams.get("full") === "1"
    ? await getSubmissionByEmail(email, assessmentId)
    : await hasStudentSubmitted(email, assessmentId)
  return NextResponse.json({ result: found })
}
