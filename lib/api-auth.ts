import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export type Role = "master" | "professor" | "secretary" | "student"

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
