import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { uploadToBlob, UploadError } from "@/lib/blob"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error

  const form = await req.formData().catch(() => null)
  const file = form?.get("file") as File | null
  const disciplineId = form?.get("disciplineId") as string | null
  if (!file || !disciplineId) {
    return NextResponse.json({ error: "Arquivo e disciplina são obrigatórios." }, { status: 400 })
  }

  try {
    const url = await uploadToBlob(file, `materials/${disciplineId}`, "material")
    return NextResponse.json({ url })
  } catch (err: any) {
    const status = err instanceof UploadError ? 400 : 500
    return NextResponse.json({ error: err.message || "Erro no upload." }, { status })
  }
}
