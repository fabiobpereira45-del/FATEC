import { pool } from "@/lib/db"
import { getFinancialSettings } from "@/lib/repos/finance"
import { listClassCurriculum } from "@/lib/repos/class-curriculum"

// Ferramentas de reparo/sincronização em massa, usadas pelos botões de
// manutenção do painel admin. Portadas da lógica anterior (Supabase) para
// SQL direto no Neon, mantendo o mesmo comportamento.

async function resolveGlobalGradeDisciplines(modality: string, poloId?: string | null) {
  const semesterModality = modality === "online" || modality === "semi_presencial" ? "semi_presencial" : "presencial"
  const { rows: semesterRows } = await pool.query(
    "select * from semesters where modality = $1 order by order_index asc", [semesterModality]
  )
  let semesters = semesterRows
  if (poloId) {
    const own = semesters.filter((s: any) => s.polo_id === poloId)
    semesters = own.length > 0 ? own : semesters.filter((s: any) => !s.polo_id)
  }
  const semesterIds = new Set(semesters.map((s: any) => s.id))

  const { rows: discRows } = await pool.query("select * from disciplines")
  const semOrder = (semId: string) => semesters.find((s: any) => s.id === semId)?.order_index ?? 999

  return discRows
    .filter((d: any) => d.semester_id && semesterIds.has(d.semester_id))
    .sort((a: any, b: any) => (semOrder(a.semester_id) - semOrder(b.semester_id)) || (a.order_index - b.order_index))
    .map((d: any) => ({
      id: d.id, name: d.name,
      applicationMonth: d.application_month, applicationYear: d.application_year,
      isConcluded: d.is_concluded,
    }))
}

export async function copyGlobalGradeToClass(classId: string) {
  const { rows: clsRows } = await pool.query("select modality, polo_id from classes where id = $1::uuid", [classId])
  if (!clsRows[0]) throw new Error("Turma não encontrada.")

  const disciplines = await resolveGlobalGradeDisciplines(clsRows[0].modality || "presencial", clsRows[0].polo_id)
  if (disciplines.length === 0) return 0

  const { rows: existingRows } = await pool.query("select discipline_id from class_curriculum where class_id = $1::uuid", [classId])
  const existingIds = new Set(existingRows.map((r: any) => r.discipline_id))

  const toInsert = disciplines.filter(d => !existingIds.has(d.id))
  let index = existingIds.size
  for (const d of toInsert) {
    await pool.query(
      `insert into class_curriculum (class_id, discipline_id, order_index, application_month, application_year, is_concluded)
       values ($1::uuid,$2::uuid,$3,$4,$5,$6)`,
      [classId, d.id, index++, d.applicationMonth || null, d.applicationYear || null, d.isConcluded || false]
    )
  }
  return toInsert.length
}

export async function backfillClassCurriculumFromGlobalGrade() {
  const { rows: classes } = await pool.query("select id, name from classes")
  const results: { classId: string; className: string; inserted: number }[] = []
  for (const c of classes) {
    const { rows: countRows } = await pool.query("select count(*)::int as n from class_curriculum where class_id = $1::uuid", [c.id])
    if (countRows[0].n > 0) continue
    const inserted = await copyGlobalGradeToClass(c.id)
    results.push({ classId: c.id, className: c.name, inserted })
  }
  return results
}

export async function syncAllAttendanceScores() {
  const { rows: students } = await pool.query("select id, name, email, cpf from students")
  const studentById = new Map(students.map((s: any) => [s.id, s]))

  const { rows: presentRows } = await pool.query(
    "select student_id, discipline_id from attendances where is_present = true and student_id is not null"
  )
  const counts = new Map<string, number>()
  for (const a of presentRows) {
    const key = `${a.student_id}:${a.discipline_id}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  for (const [key, rawCount] of counts) {
    const [studentId, disciplineId] = key.split(":")
    const score = Math.min(rawCount * 2.5, 10.0)
    const student = studentById.get(studentId) as any
    if (!student) continue
    const cleanCpf = student.cpf ? String(student.cpf).replace(/\D/g, "") : null

    const { rows: grades } = await pool.query(
      "select id, student_identifier, student_id from student_grades where discipline_id = $1::uuid", [disciplineId]
    )
    let updatedAny = false
    for (const grade of grades) {
      let isMatch = grade.student_id === studentId
      if (!isMatch && grade.student_identifier) {
        const ident = String(grade.student_identifier).toLowerCase().trim()
        const cleanIdent = ident.replace(/\D/g, "")
        if (ident === student.email?.toLowerCase().trim()) isMatch = true
        else if (cleanCpf && cleanIdent === cleanCpf) isMatch = true
      }
      if (isMatch) {
        await pool.query(
          "update student_grades set attendance_score = $1, student_id = $2::uuid where id = $3::uuid",
          [score, studentId, grade.id]
        )
        updatedAny = true
      }
    }
    if (!updatedAny) {
      await pool.query(
        `insert into student_grades
           (student_id, student_name, student_identifier, discipline_id, attendance_score,
            exam_grade, works_grade, seminar_grade, participation_bonus, custom_divisor, is_public)
         values ($1::uuid,$2,$3,$4::uuid,$5,0,0,0,0,2,false)`,
        [studentId, student.name, student.email || student.cpf || studentId, disciplineId, score]
      )
    }
  }
}

export async function syncStudentGrades(studentId: string, cpf?: string, email?: string, enrollmentNumber?: string) {
  const cleanCpf = cpf?.replace(/\D/g, "") || ""
  const idents = [cleanCpf, email?.toLowerCase().trim(), enrollmentNumber].filter(Boolean) as string[]
  if (idents.length === 0) return { affected: 0 }

  const { rows } = await pool.query(
    "update student_grades set student_id = $1::uuid where student_id is null and student_identifier = any($2) returning id",
    [studentId, idents]
  )
  return { affected: rows.length }
}

export async function bulkSyncGrades() {
  const { rows: students } = await pool.query("select id, cpf, email, enrollment_number from students")
  let totalAffected = 0
  for (const s of students) {
    const { affected } = await syncStudentGrades(s.id, s.cpf, s.email, s.enrollment_number)
    totalAffected += affected
  }
  return { totalAffected }
}

const MONTHS: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6, Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12,
}
const DESCRIPTION_SYNONYMS: Record<string, string> = {
  "evangelismo e missoes": "evangelismo e missiologia",
}
const norm = (s: string) => {
  const base = (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
  return DESCRIPTION_SYNONYMS[base] || base
}

// Reconcilia as cobranças de um aluno com a grade da turma (ou a grade global,
// se a turma ainda não tiver grade própria), preservando cobranças pagas/bolsa/isentas.
export async function syncStudentTuitionByDisciplines(studentId: string) {
  const { rows: studentRows } = await pool.query(
    "select class_id, created_at, modality, polo_id from students where id = $1::uuid", [studentId]
  )
  const student = studentRows[0]
  if (!student) return

  let studentModality = student.modality || "presencial"
  if (student.class_id) {
    const { rows: clsRows } = await pool.query("select modality from classes where id = $1::uuid", [student.class_id])
    if (clsRows[0]?.modality) studentModality = clsRows[0].modality
  }

  let disciplines: { id: string; name: string; applicationMonth: string | null; applicationYear: string | null; isConcluded: boolean }[] = []
  if (student.class_id) {
    const curriculumItems = await listClassCurriculum(student.class_id)
    if (curriculumItems.length > 0) {
      const { rows: allDisc } = await pool.query("select * from disciplines")
      const byId = new Map(allDisc.map((d: any) => [d.id, d]))
      disciplines = curriculumItems
        .map(item => {
          const d = byId.get(item.disciplineId) as any
          if (!d) return null
          return {
            id: d.id, name: d.name,
            applicationMonth: item.applicationMonth ?? d.application_month,
            applicationYear: item.applicationYear ?? d.application_year,
            isConcluded: item.isConcluded ?? d.is_concluded,
          }
        })
        .filter((d): d is NonNullable<typeof d> => !!d)
    }
  }
  if (disciplines.length === 0) {
    disciplines = await resolveGlobalGradeDisciplines(studentModality, student.polo_id)
  }
  if (disciplines.length === 0) return

  const settings = await getFinancialSettings()
  if (!settings) return

  const newCharges: any[] = []
  const enrollmentDate = new Date(student.created_at || Date.now())
  enrollmentDate.setHours(0, 0, 0, 0)
  newCharges.push({
    type: "enrollment",
    description: studentModality === "online" ? "Taxa de Matrícula (Online)" : "Taxa de Matrícula",
    discipline_id: null,
    amount: settings.enrollmentFee,
    due_date: enrollmentDate.toISOString().split("T")[0],
  })

  for (const d of disciplines) {
    const year = parseInt(d.applicationYear || "2026")
    const monthNum = d.applicationMonth ? (MONTHS[d.applicationMonth] ?? (parseInt(d.applicationMonth) || 1)) : 1
    const dueDate = new Date(year, monthNum - 1, 10)
    newCharges.push({
      type: "monthly",
      description: `Mensalidade: ${d.name}`,
      discipline_id: d.id,
      amount: settings.monthlyFee,
      due_date: dueDate.toISOString().split("T")[0],
    })
  }

  const { rows: existing } = await pool.query(
    "select * from financial_charges where student_id = $1::uuid and type <> 'expense'", [studentId]
  )
  const preserved = ["paid", "bolsa100", "bolsa50", "isento"]
  const handled = new Set<string>()
  const toDelete = new Set<string>()
  const toInsert: any[] = []

  for (const nc of newCharges) {
    const matches = existing.filter((ex: any) => {
      if (handled.has(ex.id)) return false
      if (nc.type === "enrollment" && ex.type === "enrollment") return true
      if (nc.type === "monthly" && ex.type === "monthly") {
        if (ex.discipline_id && ex.discipline_id === nc.discipline_id) return true
        if (norm(ex.description) === norm(nc.description)) return true
      }
      return false
    })

    if (matches.length > 0) {
      const chosen = matches.find((m: any) => m.status === "paid")
        ?? matches.find((m: any) => preserved.includes(m.status))
        ?? matches[0]
      handled.add(chosen.id)

      if (preserved.includes(chosen.status)) {
        await pool.query(
          "update financial_charges set due_date = $1::date, discipline_id = $2::uuid, description = $3 where id = $4::uuid",
          [nc.due_date, nc.discipline_id, nc.description, chosen.id]
        )
      } else {
        await pool.query(
          "update financial_charges set due_date = $1::date, amount = $2, discipline_id = $3::uuid, description = $4 where id = $5::uuid",
          [nc.due_date, nc.amount, nc.discipline_id, nc.description, chosen.id]
        )
      }
      for (const m of matches) {
        if (m.id !== chosen.id && m.status !== "paid") toDelete.add(m.id)
      }
    } else {
      toInsert.push(nc)
    }
  }

  for (const ex of existing) {
    if (!handled.has(ex.id) && ex.status !== "paid") toDelete.add(ex.id)
  }

  if (toDelete.size > 0) {
    await pool.query("delete from financial_charges where id = any($1)", [Array.from(toDelete)])
  }
  for (const nc of toInsert) {
    await pool.query(
      `insert into financial_charges (student_id, type, description, discipline_id, amount, due_date, status)
       values ($1::uuid,$2,$3,$4::uuid,$5,$6::date,'pending')`,
      [studentId, nc.type, nc.description, nc.discipline_id, nc.amount, nc.due_date]
    )
  }
}

export async function getAvailableSlots() {
  const { rows: capRows } = await pool.query("select coalesce(sum(max_students),0)::int as cap from classes")
  const { rows: countRows } = await pool.query("select count(*)::int as n from students")
  const available = capRows[0].cap - countRows[0].n
  return available > 0 ? available : 0
}
