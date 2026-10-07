import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { updateSemester, deleteSemester } from "@/lib/repos/semesters"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await updateSemester(id, await req.json().catch(() => ({})))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Ctx) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { id } = await params
  await deleteSemester(id)
  return NextResponse.json({ success: true })
}
