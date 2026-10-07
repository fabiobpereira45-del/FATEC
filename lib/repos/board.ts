import { pool } from "@/lib/db"

function toBoardMember(r: any) {
  return { id: r.id, name: r.name, role: r.role, category: r.category, avatar_url: r.avatar_url, createdAt: new Date(r.created_at).toISOString() }
}

export async function listBoardMembers() {
  const { rows } = await pool.query("select * from board_members order by category desc")
  return rows.map(toBoardMember)
}

export async function updateBoardMemberAvatar(id: string, avatarUrl: string) {
  await pool.query("update board_members set avatar_url = $1 where id = $2::uuid", [avatarUrl, id])
}
