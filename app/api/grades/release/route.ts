import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { releaseAllGrades, blockAllGrades } from "@/lib/repos/grades"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => ({}))
  if (body.action === "block") {
    await blockAllGrades(body.classId)
  } else {
    await releaseAllGrades(body.classId)
  }
  return NextResponse.json({ success: true })
}
