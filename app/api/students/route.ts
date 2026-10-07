import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listStudents } from "@/lib/repos/students"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary", "professor"])
  if ("error" in u) return u.error
  return NextResponse.json(await listStudents())
}
