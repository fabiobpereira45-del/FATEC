import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { listChallengeSubmissions, createChallengeSubmission, deleteChallengeSubmission, deleteChallengeSubmissionsByChallenge } from "@/lib/repos/challenges"

export async function GET(request: Request) {
  const u = await requireUser(request)
  if ("error" in u) return u.error
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")
  const challengeId = searchParams.get("challengeId")

  if (studentId) {
    if (u.role === "student" && !(await isOwnStudent(u.user.id, studentId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    return NextResponse.json(await listChallengeSubmissions({ studentId }))
  }
  if (challengeId) {
    if (u.role === "student") return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    return NextResponse.json(await listChallengeSubmissions({ challengeId }))
  }
  return NextResponse.json({ error: "Missing filter" }, { status: 400 })
}

export async function POST(request: Request) {
  const u = await requireUser(request)
  if ("error" in u) return u.error
  const body = await request.json().catch(() => null)
  if (!body?.challenge_id || !body?.student_id) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 })
  }
  if (u.role === "student" && !(await isOwnStudent(u.user.id, body.student_id))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  await createChallengeSubmission(body)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const u = await requireUser(request, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const challengeId = searchParams.get("challengeId")

  if (id) {
    await deleteChallengeSubmission(id)
  } else if (challengeId) {
    await deleteChallengeSubmissionsByChallenge(challengeId)
  } else {
    return NextResponse.json({ error: "Missing id or challengeId" }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
