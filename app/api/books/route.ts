import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listBooks, saveBook, deleteBook } from "@/lib/repos/library"

// Leitura exige login (aluno ou staff), igual ao restante do portal.
export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const data = await listBooks({
    category: searchParams.get("category") || undefined,
    poloId: searchParams.get("poloId") || undefined,
    search: searchParams.get("search") || undefined,
  })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const book = await req.json().catch(() => null)
  if (!book?.title || !book?.author) {
    return NextResponse.json({ error: "Título e autor são obrigatórios." }, { status: 400 })
  }
  const data = await saveBook(book)
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
  await deleteBook(id)
  return NextResponse.json({ success: true })
}
