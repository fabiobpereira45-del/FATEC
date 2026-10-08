import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

export type Role = "master" | "professor" | "secretary" | "student"

// O id da sessão (Better Auth) é diferente do id da linha em "students".
// Use isto para checar se o aluno logado é o dono de um studentId recebido
// em query/body — nunca compare u.user.id diretamente com um studentId.
export async function isOwnStudent(authUserId: string, studentId: string): Promise<boolean> {
  const { rows } = await pool.query(
    "select 1 from students where id = $1::uuid and auth_user_id = $2", [studentId, authUserId]
  )
  return rows.length > 0
}

// Valida a sessão do Better Auth e, se informado, o papel do usuário.
export async function requireUser(req: Request, roles?: Role[]) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) }
  }
  const role = (session.user as { role?: string }).role as Role
  if (roles && !roles.includes(role)) {
    return { error: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) }
  }
  return { user: session.user, role }
}
