import { pool } from "@/lib/db"
import { saveAttendance } from "@/lib/repos/attendance"

export interface EadLessonInput {
  disciplineId: string
  title: string
  description?: string | null
  videoUrl: string
  coverUrl?: string | null
  orderIndex?: number
  availableFrom?: string | null
  availableUntil?: string | null
  lessonType?: "recorded" | "live_meet"
  meetUrl?: string | null
  minMinutesForPresence?: number
}

function toLesson(r: any) {
  return {
    id: r.id,
    disciplineId: r.discipline_id,
    title: r.title,
    description: r.description ?? undefined,
    videoUrl: r.video_url,
    coverUrl: r.cover_url ?? undefined,
    orderIndex: r.order_index,
    availableFrom: r.available_from ? new Date(r.available_from).toISOString() : null,
    availableUntil: r.available_until ? new Date(r.available_until).toISOString() : null,
    lessonType: r.lesson_type ?? "recorded",
    meetUrl: r.meet_url ?? undefined,
    liveDate: r.live_date ? new Date(r.live_date).toISOString() : undefined,
    minMinutesForPresence: r.min_minutes_for_presence ?? 0,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listEadLessons(disciplineId: string) {
  const { rows } = await pool.query(
    "select * from ead_lessons where discipline_id = $1::uuid order by order_index asc", [disciplineId]
  )
  return rows.map(toLesson)
}

export async function createEadLesson(input: EadLessonInput) {
  const { rows } = await pool.query(
    `insert into ead_lessons
       (discipline_id, title, description, video_url, cover_url, order_index, available_from,
        available_until, lesson_type, meet_url, live_date, min_minutes_for_presence)
     values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [input.disciplineId, input.title.trim(), input.description || null, input.videoUrl.trim(),
     input.coverUrl || null, input.orderIndex || 0, input.availableFrom || null, input.availableUntil || null,
     input.lessonType || "recorded", input.meetUrl || (input.lessonType === "live_meet" ? input.videoUrl : null),
     input.availableFrom ? input.availableFrom.substring(0, 10) : null, input.minMinutesForPresence ?? 0]
  )
  return toLesson(rows[0])
}

export async function updateEadLesson(id: string, data: Partial<EadLessonInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }

  if (data.title !== undefined) add("title", data.title.trim())
  if (data.description !== undefined) add("description", data.description)
  if (data.videoUrl !== undefined) add("video_url", data.videoUrl.trim())
  if (data.coverUrl !== undefined) add("cover_url", data.coverUrl)
  if (data.disciplineId !== undefined) add("discipline_id", data.disciplineId)
  if (data.orderIndex !== undefined) add("order_index", data.orderIndex)
  if (data.availableFrom !== undefined) {
    add("available_from", data.availableFrom || null)
    add("live_date", data.availableFrom ? data.availableFrom.substring(0, 10) : null)
  }
  if (data.availableUntil !== undefined) add("available_until", data.availableUntil || null)
  if (data.lessonType !== undefined) add("lesson_type", data.lessonType)
  if (data.meetUrl !== undefined) add("meet_url", data.meetUrl)
  if (data.minMinutesForPresence !== undefined) add("min_minutes_for_presence", data.minMinutesForPresence)
  if (sets.length === 0) return

  vals.push(id)
  const { rows } = await pool.query(`update ead_lessons set ${sets.join(", ")} where id = $${vals.length}::uuid returning *`, vals)
  return rows[0] ? toLesson(rows[0]) : null
}

export async function deleteEadLesson(id: string) {
  await pool.query("delete from ead_lessons where id = $1::uuid", [id])
}

// ── Acompanhamento de aula ao vivo ───────────────────────────────────────────

function toTracking(r: any) {
  return {
    id: r.id,
    lessonId: r.lesson_id,
    studentId: r.student_id,
    studentName: r.student_name || "Aluno",
    disciplineId: r.discipline_id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
    joinedAt: new Date(r.joined_at).toISOString(),
    lastPingAt: new Date(r.last_ping_at).toISOString(),
    totalSeconds: r.total_seconds,
    isValidated: r.is_validated,
    status: r.status,
  }
}

export async function recordLiveSessionJoin(
  lessonId: string, studentId: string, studentName: string, disciplineId: string,
  lessonDate: string | undefined, minMinutes: number
) {
  const targetDate = lessonDate || new Date().toISOString().substring(0, 10)
  const isInstant = minMinutes <= 0

  const { rows: existing } = await pool.query(
    "select * from ead_live_tracking where lesson_id = $1::uuid and student_id = $2::uuid", [lessonId, studentId]
  )

  let trackingId: string, currentSeconds: number, validated: boolean = isInstant
  if (existing[0]) {
    trackingId = existing[0].id
    currentSeconds = existing[0].total_seconds || 0
    validated = existing[0].is_validated || isInstant
    await pool.query(
      "update ead_live_tracking set last_ping_at = now(), status = 'online', is_validated = $1 where id = $2",
      [validated, trackingId]
    )
  } else {
    const { rows } = await pool.query(
      `insert into ead_live_tracking (lesson_id, student_id, student_name, discipline_id, date, total_seconds, is_validated, status)
       values ($1::uuid,$2::uuid,$3,$4::uuid,$5::date,0,$6,'online') returning id`,
      [lessonId, studentId, studentName, disciplineId, targetDate, validated]
    )
    trackingId = rows[0].id
    currentSeconds = 0
  }

  if (validated && studentId && disciplineId) {
    await saveAttendance(studentId, disciplineId, targetDate, true).catch(err => console.warn("Auto-attendance on join warning:", err))
  }

  return { trackingId, isValidated: validated, totalSeconds: currentSeconds }
}

export async function pingLiveSessionHeartbeat(
  trackingId: string, secondsToAdd: number, studentId: string, disciplineId: string, date: string, minMinutes: number
) {
  const targetDate = date || new Date().toISOString().substring(0, 10)
  const { rows } = await pool.query("select * from ead_live_tracking where id = $1", [trackingId])
  const current = rows[0]
  if (!current) return { totalSeconds: secondsToAdd, isValidated: false }

  const totalSec = (current.total_seconds || 0) + secondsToAdd
  const isValidated = current.is_validated || totalSec >= minMinutes * 60
  await pool.query(
    "update ead_live_tracking set total_seconds = $1, last_ping_at = now(), status = 'online', is_validated = $2 where id = $3",
    [totalSec, isValidated, trackingId]
  )

  if (isValidated && studentId && disciplineId) {
    await saveAttendance(studentId, disciplineId, targetDate, true).catch(err => console.warn("Heartbeat auto-attendance sync warning:", err))
  }

  return { totalSeconds: totalSec, isValidated }
}

export async function getLiveLessonTracking(lessonId: string) {
  const { rows } = await pool.query(
    "select * from ead_live_tracking where lesson_id = $1::uuid order by joined_at desc", [lessonId]
  )
  return rows.map(toTracking)
}
