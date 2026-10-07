import { pool } from "@/lib/db"
import { triggerN8nWebhook } from "@/lib/n8n"

function toAttendance(r: any) {
  return {
    id: r.id,
    studentId: r.student_id,
    disciplineId: r.discipline_id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
    isPresent: !!r.is_present,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listAttendances(disciplineId: string) {
  const { rows } = await pool.query(
    "select * from attendances where discipline_id = $1::uuid order by date desc", [disciplineId]
  )
  return rows.map(toAttendance)
}

export async function listStudentAttendances(studentId: string) {
  const { rows } = await pool.query(
    "select * from attendances where student_id = $1::uuid order by date desc", [studentId]
  )
  return rows.map(toAttendance)
}

// Além de marcar a presença, recalcula a nota de frequência (2.5 por presença, até 10)
// e a propaga para o boletim do aluno — igual ao comportamento anterior.
export async function saveAttendance(studentId: string, disciplineId: string, date: string, isPresent: boolean) {
  const { rows: existing } = await pool.query(
    "select id from attendances where student_id = $1::uuid and discipline_id = $2::uuid and date = $3::date",
    [studentId, disciplineId, date]
  )
  if (existing[0]) {
    await pool.query("update attendances set is_present = $1 where id = $2::uuid", [isPresent, existing[0].id])
  } else {
    await pool.query(
      "insert into attendances (student_id, discipline_id, date, is_present) values ($1::uuid, $2::uuid, $3::date, $4)",
      [studentId, disciplineId, date, isPresent]
    )
  }

  try {
    const { rows: allAtt } = await pool.query(
      "select is_present from attendances where student_id = $1::uuid and discipline_id = $2::uuid",
      [studentId, disciplineId]
    )
    const presenceCount = allAtt.filter((a: any) => a.is_present).length
    const attendanceScore = Math.min(presenceCount * 2.5, 10.0)

    const { rows: studentRows } = await pool.query(
      "select id, name, email, cpf from students where id = $1::uuid", [studentId]
    )
    const student = studentRows[0]
    if (student) {
      const cleanCpf = student.cpf ? String(student.cpf).replace(/\D/g, "") : null
      const { rows: existingGrades } = await pool.query(
        "select id, student_identifier, student_id from student_grades where discipline_id = $1::uuid",
        [disciplineId]
      )

      let updatedAny = false
      for (const grade of existingGrades) {
        let isMatch = grade.student_id === studentId
        if (!isMatch && grade.student_identifier) {
          const ident = String(grade.student_identifier).toLowerCase().trim()
          const cleanIdent = ident.replace(/\D/g, "")
          if (ident === student.email?.toLowerCase().trim()) isMatch = true
          else if (cleanCpf && cleanIdent === cleanCpf) isMatch = true
        }
        if (isMatch) {
          await pool.query(
            "update student_grades set student_id = $1::uuid, student_name = $2, attendance_score = $3 where id = $4::uuid",
            [studentId, student.name, attendanceScore, grade.id]
          )
          updatedAny = true
        }
      }

      if (!updatedAny) {
        await pool.query(
          `insert into student_grades
             (student_id, student_name, attendance_score, discipline_id, student_identifier,
              exam_grade, works_grade, seminar_grade, participation_bonus, custom_divisor, is_public)
           values ($1::uuid, $2, $3, $4::uuid, $5, 0, 0, 0, 0, 2, false)`,
          [studentId, student.name, attendanceScore, disciplineId, student.email || student.cpf || student.id]
        )
      }
    }
  } catch (err) {
    console.error("Erro ao atualizar nota de presença no boletim:", err)
  }

  if (!isPresent) {
    const { rows: studentRows } = await pool.query("select name, phone from students where id = $1::uuid", [studentId])
    const { rows: discRows } = await pool.query("select name from disciplines where id = $1::uuid", [disciplineId])
    if (studentRows[0]) {
      await triggerN8nWebhook("falta_registrada", {
        type: "attendance",
        studentName: studentRows[0].name,
        phone: studentRows[0].phone,
        disciplineName: discRows[0]?.name || "Disciplina",
        date,
      }).catch(() => {})
    }
  }
}

export async function getAttendanceLock(disciplineId: string, date: string) {
  const { rows } = await pool.query(
    "select * from attendance_locks where discipline_id = $1::uuid and date = $2::date",
    [disciplineId, date]
  )
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    disciplineId: r.discipline_id,
    date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
    lockedBy: r.locked_by,
    lockedAt: new Date(r.locked_at).toISOString(),
  }
}

export async function lockAttendance(disciplineId: string, date: string, lockedBy: string) {
  await pool.query(
    "insert into attendance_locks (discipline_id, date, locked_by) values ($1::uuid, $2::date, $3)",
    [disciplineId, date, lockedBy]
  )
}

export async function unlockAttendance(id: string) {
  await pool.query("delete from attendance_locks where id = $1::uuid", [id])
}
