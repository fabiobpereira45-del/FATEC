import { pool } from "@/lib/db"
import { triggerN8nWebhook } from "@/lib/n8n"

function toMessage(r: any) {
  return {
    id: r.id,
    studentId: r.student_id,
    disciplineId: r.discipline_id,
    message: r.message,
    isFromStudent: r.is_from_student,
    read: r.read,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listChatMessages(disciplineId: string, studentId: string) {
  const { rows } = await pool.query(
    "select * from chats where discipline_id = $1::uuid and student_id = $2::uuid order by created_at asc",
    [disciplineId, studentId]
  )
  return rows.map(toMessage)
}

export async function sendChatMessage(studentId: string, disciplineId: string, message: string, isFromStudent: boolean) {
  const { rows } = await pool.query(
    `insert into chats (student_id, discipline_id, message, is_from_student, read)
     values ($1::uuid, $2::uuid, $3, $4, false) returning *`,
    [studentId, disciplineId, message, isFromStudent]
  )
  const created = toMessage(rows[0])

  if (!isFromStudent) {
    const { rows: studentRows } = await pool.query("select name, phone from students where id = $1::uuid", [studentId])
    if (studentRows[0]) {
      await triggerN8nWebhook("nova_mensagem_chat", {
        type: "chat",
        studentName: studentRows[0].name,
        phone: studentRows[0].phone,
        message,
      }).catch(() => {})
    }
  }

  return created
}

export async function markChatAsRead(id: string) {
  await pool.query("update chats set read = true where id = $1::uuid", [id])
}
