import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { deleteStudyMaterial } from "@/lib/repos/study-materials"
import { deleteFromBlob } from "@/lib/blob"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  const fileUrl = await deleteStudyMaterial(id)
  if (fileUrl) await deleteFromBlob(fileUrl)
  return NextResponse.json({ success: true })
}
