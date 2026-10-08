import { NextResponse } from "next/server"
import { requireUser, isOwnStudent } from "@/lib/api-auth"
import { listBookLoans, requestBookLoan, directAdminBorrow, getBook } from "@/lib/repos/library"

export async function GET(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId") || undefined
  if (u.role === "student") {
    if (!studentId || !(await isOwnStudent(u.user.id, studentId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
  }
  const data = await listBookLoans({
    studentId,
    status: searchParams.get("status") || undefined,
    poloId: searchParams.get("poloId") || undefined,
  })
  return NextResponse.json({ success: true, data })
}

// O próprio aluno reserva o livro; staff pode registrar empréstimo direto (sem reserva prévia).
export async function POST(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.bookId || !body?.studentId) {
    return NextResponse.json({ error: "Livro e aluno são obrigatórios." }, { status: 400 })
  }
  if (u.role === "student" && !(await isOwnStudent(u.user.id, body.studentId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const book = await getBook(body.bookId)
  if (!book) return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 })

  const student = {
    id: body.studentId, name: body.studentName, email: body.studentEmail,
    phone: body.studentPhone, cpf: body.studentCpf, poloId: body.poloId,
  }

  try {
    if (body.direct) {
      if (!["master", "secretary", "professor"].includes(u.role)) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
      }
      const data = await directAdminBorrow({ book, student, registeredBy: body.registeredBy })
      return NextResponse.json({ success: true, data }, { status: 201 })
    }
    const data = await requestBookLoan(book, student)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
