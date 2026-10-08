import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import {
  copyGlobalGradeToClass, backfillClassCurriculumFromGlobalGrade, syncAllAttendanceScores,
  syncStudentGrades, bulkSyncGrades, syncStudentTuitionByDisciplines, getAvailableSlots,
} from "@/lib/repos/sync-tools"

// Ferramentas de manutenção em massa: restritas a master/secretaria.
export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  const action = body?.action

  switch (action) {
    case "copyGlobalGradeToClass":
      if (!body.classId) return NextResponse.json({ error: "classId é obrigatório." }, { status: 400 })
      return NextResponse.json({ inserted: await copyGlobalGradeToClass(body.classId) })
    case "backfillClassCurriculum":
      return NextResponse.json({ results: await backfillClassCurriculumFromGlobalGrade() })
    case "syncAllAttendanceScores":
      await syncAllAttendanceScores()
      return NextResponse.json({ success: true })
    case "syncStudentGrades":
      if (!body.studentId) return NextResponse.json({ error: "studentId é obrigatório." }, { status: 400 })
      return NextResponse.json(await syncStudentGrades(body.studentId, body.cpf, body.email, body.enrollmentNumber))
    case "bulkSyncGrades":
      return NextResponse.json(await bulkSyncGrades())
    case "syncStudentTuition":
      if (!body.studentId) return NextResponse.json({ error: "studentId é obrigatório." }, { status: 400 })
      await syncStudentTuitionByDisciplines(body.studentId)
      return NextResponse.json({ success: true })
    default:
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 })
  }
}

// Pública: a home exibe o número de vagas sem exigir login.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get("action") === "availableSlots") {
    return NextResponse.json({ available: await getAvailableSlots() })
  }
  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 })
}
