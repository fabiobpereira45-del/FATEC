import { NextResponse } from "next/server"
import { registerStudent } from "@/lib/repos/enrollment"

// Pública: autocadastro do aluno (fora do fluxo de matrícula paga).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { name, cpf, password } = body || {}
  if (!name || !cpf || !password || String(password).length < 8) {
    return NextResponse.json({ error: "Nome, CPF e senha (mín. 8 caracteres) são obrigatórios." }, { status: 400 })
  }
  try {
    const result = await registerStudent(name, cpf, password)
    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar cadastro." }, { status: 400 })
  }
}
