import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { deleteClassCurriculumItem } from "@/lib/repos/class-curriculum"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteClassCurriculumItem(id)
  return NextResponse.json({ success: true })
}
