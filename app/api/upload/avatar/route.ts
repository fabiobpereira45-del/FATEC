import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { uploadToBlob, UploadError } from "@/lib/blob"

const FOLDERS: Record<string, string> = { student: "students", professor: "professors", board: "board" }

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary", "professor", "student"])
  if ("error" in u) return u.error

  const form = await req.formData().catch(() => null)
  const file = form?.get("file") as File | null
  const type = form?.get("type") as string | null
  if (!file || !type || !FOLDERS[type]) {
    return NextResponse.json({ error: "Arquivo e tipo são obrigatórios." }, { status: 400 })
  }
  // Um aluno/professor só envia o próprio avatar; board fica restrito a master/secretaria.
  if (type === "board" && u.role !== "master" && u.role !== "secretary") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  try {
    const url = await uploadToBlob(file, FOLDERS[type], "avatar")
    return NextResponse.json({ url })
  } catch (err: any) {
    const status = err instanceof UploadError ? 400 : 500
    return NextResponse.json({ error: err.message || "Erro no upload." }, { status })
  }
}
