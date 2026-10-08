import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getLiveLessonTracking } from "@/lib/repos/ead"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get("lessonId")
  if (!lessonId) return NextResponse.json({ error: "lessonId é obrigatório" }, { status: 400 })
  return NextResponse.json(await getLiveLessonTracking(lessonId))
}
