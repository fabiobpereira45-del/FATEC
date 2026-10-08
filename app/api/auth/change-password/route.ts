import { NextResponse } from "next/server"
import { hashPassword } from "better-auth/crypto"
import { requireUser } from "@/lib/api-auth"
import { pool } from "@/lib/db"

// Troca a própria senha sem exigir a senha atual — igual ao comportamento
// anterior do Supabase Auth (basta ter uma sessão ativa). Grava o hash
// direto na conta de credenciais do Better Auth.
export async function POST(req: Request) {
  const u = await requireUser(req)
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  const newPassword = body?.newPassword
  if (!newPassword || String(newPassword).length < 8) {
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 })
  }
  const hash = await hashPassword(newPassword)
  await pool.query(
    `update account set password = $1 where "userId" = $2 and "providerId" = 'credential'`,
    [hash, u.user.id]
  )
  return NextResponse.json({ success: true })
}
