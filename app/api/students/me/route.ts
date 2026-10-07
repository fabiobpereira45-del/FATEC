import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getStudentByAuthUserId } from "@/lib/repos/students"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const student = await getStudentByAuthUserId(u.user.id, (u.user as { email?: string }).email)
  return NextResponse.json(student)
}
