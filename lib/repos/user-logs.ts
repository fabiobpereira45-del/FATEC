import { pool } from "@/lib/db"

export interface UserLogInput {
  user_id?: string
  user_email?: string
  user_name?: string
  role?: string
  action: string
  metadata?: unknown
}

function toLog(r: any) {
  return {
    id: r.id,
    user_id: r.user_id ?? undefined,
    user_email: r.user_email ?? undefined,
    user_name: r.user_name ?? undefined,
    role: r.role ?? undefined,
    action: r.action,
    metadata: r.metadata ?? undefined,
    created_at: new Date(r.created_at).toISOString(),
  }
}

export async function logUserActivity(log: UserLogInput) {
  await pool.query(
    `insert into user_logs (user_id, user_email, user_name, role, action, metadata)
     values ($1,$2,$3,$4,$5,$6)`,
    [log.user_id || null, log.user_email || null, log.user_name || null, log.role || null,
     log.action, log.metadata ? JSON.stringify(log.metadata) : null]
  )
}

export async function listUserLogs(limit = 100) {
  const { rows } = await pool.query("select * from user_logs order by created_at desc limit $1", [limit])
  return rows.map(toLog)
}
