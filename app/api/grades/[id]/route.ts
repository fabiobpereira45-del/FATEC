import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { deleteStudentGrade } from "@/lib/repos/grades"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteStudentGrade(id)
  return NextResponse.json({ success: true })
}
