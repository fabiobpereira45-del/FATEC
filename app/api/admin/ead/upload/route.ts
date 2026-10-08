import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { uploadToBlob, UploadError } from "@/lib/blob"

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  const form = await req.formData().catch(() => null)
  const file = form?.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  try {
    const url = await uploadToBlob(file, "ead-covers", "avatar")
    return NextResponse.json({ success: true, url })
  } catch (err: any) {
    const status = err instanceof UploadError ? 400 : 500
    return NextResponse.json({ error: err.message || "Falha no upload da capa" }, { status })
  }
}
