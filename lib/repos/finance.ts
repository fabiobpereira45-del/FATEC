import { pool } from "@/lib/db"
import { triggerN8nWebhook } from "@/lib/n8n"
import { BRAND } from "@/lib/brand"

export interface ChargeInput {
  studentId?: string | null
  type: string
  description: string
  amount: number
  dueDate: string
  disciplineId?: string | null
  professorId?: string | null
  classId?: string | null
}

function toCharge(r: any) {
  return {
    id: r.id,
    studentId: r.student_id,
    type: r.type,
    description: r.description,
    amount: Number(r.amount),
    dueDate: r.due_date instanceof Date ? r.due_date.toISOString().split("T")[0] : r.due_date,
    status: r.status,
    paymentDate: r.payment_date ? new Date(r.payment_date).toISOString() : undefined,
    paymentMethod: r.payment_method ?? undefined,
    actualPaidAmount: r.actual_paid_amount !== null ? Number(r.actual_paid_amount) : undefined,
    disciplineId: r.discipline_id ?? undefined,
    professorId: r.professor_id ?? undefined,
    classId: r.class_id ?? undefined,
    asaasPaymentId: r.asaas_payment_id ?? undefined,
    pixQrcode: r.pix_qrcode ?? undefined,
    pixCopyPaste: r.pix_copy_paste ?? undefined,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listFinancialCharges(studentId?: string) {
  const sql = studentId
    ? "select * from financial_charges where student_id = $1::uuid order by due_date desc"
    : "select * from financial_charges order by due_date desc"
  const { rows } = await pool.query(sql, studentId ? [studentId] : [])
  return rows.map(toCharge)
}

export async function createFinancialCharge(input: ChargeInput) {
  const { rows } = await pool.query(
    `insert into financial_charges (student_id, type, description, amount, due_date, discipline_id, professor_id, class_id, status)
     values ($1::uuid, $2, $3, $4, $5::date, $6::uuid, $7, $8::uuid, 'pending') returning *`,
    [input.studentId || null, input.type, input.description, input.amount, input.dueDate,
     input.disciplineId || null, input.professorId || null, input.classId || null]
  )
  const created = toCharge(rows[0])

  try {
    if (input.studentId) {
      const { rows: studentRows } = await pool.query("select name, phone from students where id = $1::uuid", [input.studentId])
      if (studentRows[0]) {
        await triggerN8nWebhook("pagamento_gerado", {
          type: "financial",
          studentName: studentRows[0].name,
          studentPhone: studentRows[0].phone,
          amount: input.amount,
          description: input.description,
          dueDate: input.dueDate,
        })
      }
    }
  } catch (err) {
    console.error("Erro ao disparar WhatsApp n8n financeiro:", err)
  }

  return created
}

export async function updateFinancialCharge(id: string, data: Partial<{ amount: number; description: string; dueDate: string; status: string }>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.amount !== undefined) add("amount", data.amount)
  if (data.description !== undefined) add("description", data.description)
  if (data.dueDate !== undefined) add("due_date", data.dueDate)
  if (data.status !== undefined) {
    add("status", data.status)
    if (["pending", "cancelled", "isento", "bolsa100"].includes(data.status)) {
      sets.push("payment_date = null", "payment_method = null", "actual_paid_amount = null", "pix_qrcode = null", "pix_copy_paste = null")
    }
  }
  if (sets.length === 0) return
  vals.push(id)
  await pool.query(`update financial_charges set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

async function firePaymentSideEffects(id: string) {
  const { rows } = await pool.query(
    `select fc.*, s.name as student_name, s.phone as student_phone
       from financial_charges fc left join students s on s.id = fc.student_id
      where fc.id = $1::uuid`,
    [id]
  )
  const charge = rows[0]
  if (!charge) return
  await triggerN8nWebhook("pagamento_confirmado", {
    type: "payment",
    name: charge.student_name,
    phone: charge.student_phone,
    amount: charge.amount,
    description: charge.description,
  }).catch(() => {})

  if (charge.type === "enrollment" && charge.student_id) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || BRAND.siteUrl
    await fetch(`${baseUrl}/api/student/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: charge.student_id }),
    }).catch(e => console.error("Activation fetch error:", e))
  }
}

export async function updateFinancialChargeStatus(id: string, status: string) {
  const sets = ["status = $1"]
  const vals: unknown[] = [status]
  if (status === "paid") sets.push("payment_date = now()")
  if (["pending", "cancelled", "isento", "bolsa100"].includes(status)) {
    sets.push("payment_date = null", "payment_method = null", "actual_paid_amount = null",
      "asaas_payment_id = null", "pix_qrcode = null", "pix_copy_paste = null")
  }
  vals.push(id)
  await pool.query(`update financial_charges set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
  if (status === "paid") await firePaymentSideEffects(id).catch(err => console.error("Error in post-payment actions:", err))
}

export async function updateFinancialChargesStatusBatch(ids: string[], status: string) {
  const sets = ["status = $1"]
  if (status === "paid") sets.push("payment_date = now()")
  if (status === "pending") sets.push("payment_date = null")
  await pool.query(`update financial_charges set ${sets.join(", ")} where id = any($2)`, [status, ids])
}

export async function settleFinancialCharge(id: string, data: { paidAmount: number; method: "cartao" | "pix" | "dinheiro"; date: string }) {
  await pool.query(
    `update financial_charges
        set status = 'paid', actual_paid_amount = $1, payment_method = $2, payment_date = $3::timestamptz
      where id = $4::uuid`,
    [data.paidAmount, data.method, data.date, id]
  )
  await firePaymentSideEffects(id).catch(err => console.error("Error in post-payment actions:", err))
}

export async function reverseFinancialCharge(id: string) {
  await pool.query(
    `update financial_charges
        set status = 'pending', actual_paid_amount = null, payment_method = null,
            payment_date = null, pix_qrcode = null, pix_copy_paste = null
      where id = $1::uuid`,
    [id]
  )
}

export async function deleteFinancialCharge(id: string) {
  await pool.query("delete from financial_charges where id = $1::uuid", [id])
}

// ── Despesas ─────────────────────────────────────────────────────────────────

function toExpense(r: any) {
  return {
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    category: r.category,
    dueDate: r.due_date instanceof Date ? r.due_date.toISOString().split("T")[0] : r.due_date,
    status: r.status,
    paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listExpenses() {
  const { rows } = await pool.query("select * from expenses order by due_date desc")
  return rows.map(toExpense)
}

export async function createExpense(input: { description: string; amount: number; category: string; dueDate: string }) {
  const { rows } = await pool.query(
    "insert into expenses (description, amount, category, due_date, status) values ($1, $2, $3, $4::date, 'pending') returning *",
    [input.description, input.amount, input.category, input.dueDate]
  )
  return toExpense(rows[0])
}

export async function createExpenseBatch(items: { description: string; amount: number; category: string; dueDate: string }[]) {
  for (const exp of items) await createExpense(exp)
}

export async function updateExpense(id: string, data: Partial<{ description: string; amount: number; category: string; dueDate: string; status: string }>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.description !== undefined) add("description", data.description)
  if (data.amount !== undefined) add("amount", data.amount)
  if (data.category !== undefined) add("category", data.category)
  if (data.dueDate !== undefined) add("due_date", data.dueDate)
  if (data.status !== undefined) {
    add("status", data.status)
    sets.push(data.status === "paid" ? "paid_at = now()" : "paid_at = null")
  }
  if (sets.length === 0) return
  vals.push(id)
  await pool.query(`update expenses set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteExpense(id: string) {
  await pool.query("delete from expenses where id = $1::uuid", [id])
}

// ── Configurações ────────────────────────────────────────────────────────────

function toFinancialSettings(r: any) {
  return {
    id: r.id,
    enrollmentFee: Number(r.enrollment_fee || 0),
    monthlyFee: Number(r.monthly_fee || 0),
    enrollmentFeeOnline: r.enrollment_fee_online !== null ? Number(r.enrollment_fee_online) : Number(r.enrollment_fee || 0),
    monthlyFeeOnline: r.monthly_fee_online !== null ? Number(r.monthly_fee_online) : Number(r.monthly_fee || 0),
    secondCallFee: Number(r.second_call_fee || 0),
    finalExamFee: Number(r.final_exam_fee || 0),
    totalMonths: Number(r.total_months || 18),
    proLaboreFeePerLesson: Number(r.pro_labore_fee_per_lesson || 0),
    creditCardUrl: r.credit_card_url ?? undefined,
    pixKey: r.pix_key ?? undefined,
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export async function getFinancialSettings() {
  const { rows } = await pool.query("select * from financial_settings order by updated_at desc limit 1")
  return rows[0] ? toFinancialSettings(rows[0]) : null
}

export async function saveFinancialSettings(config: Record<string, unknown>) {
  const { rows: existing } = await pool.query("select id from financial_settings limit 1")
  const vals = [
    config.enrollmentFee, config.monthlyFee, config.enrollmentFeeOnline ?? null, config.monthlyFeeOnline ?? null,
    config.secondCallFee, config.finalExamFee, config.totalMonths, config.proLaboreFeePerLesson,
    config.creditCardUrl || null, config.pixKey || null,
  ]
  if (existing[0]) {
    await pool.query(
      `update financial_settings set
         enrollment_fee=$1, monthly_fee=$2, enrollment_fee_online=$3, monthly_fee_online=$4,
         second_call_fee=$5, final_exam_fee=$6, total_months=$7, pro_labore_fee_per_lesson=$8,
         credit_card_url=$9, pix_key=$10, updated_at=now()
       where id = $11`,
      [...vals, existing[0].id]
    )
  } else {
    await pool.query(
      `insert into financial_settings
         (enrollment_fee, monthly_fee, enrollment_fee_online, monthly_fee_online, second_call_fee,
          final_exam_fee, total_months, pro_labore_fee_per_lesson, credit_card_url, pix_key)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      vals
    )
  }

  await pool.query("update financial_charges set amount = $1 where type = 'enrollment' and status = 'pending'", [config.enrollmentFee])
  await pool.query("update financial_charges set amount = $1 where type = 'monthly' and status in ('pending','late')", [config.monthlyFee])
  await pool.query("update financial_charges set amount = $1 where type = 'monthly' and status = 'bolsa50'", [Number(config.monthlyFee) / 2])
}

function toAsaasConfig(r: any) {
  return { id: r.id, apiKey: r.api_key, mode: r.mode, pixKey: r.pix_key ?? undefined, updatedAt: new Date(r.updated_at).toISOString() }
}

export async function getAsaasConfig() {
  const { rows } = await pool.query("select * from asaas_config limit 1")
  return rows[0] ? toAsaasConfig(rows[0]) : null
}

export async function saveAsaasConfig(config: { apiKey: string; mode: string; pixKey?: string }) {
  const { rows: existing } = await pool.query("select id from asaas_config limit 1")
  if (existing[0]) {
    await pool.query(
      "update asaas_config set api_key = $1, mode = $2, pix_key = coalesce($3, pix_key), updated_at = now() where id = $4",
      [config.apiKey.trim(), config.mode, config.pixKey ?? null, existing[0].id]
    )
  } else {
    await pool.query(
      "insert into asaas_config (api_key, mode, pix_key) values ($1, $2, $3)",
      [config.apiKey.trim(), config.mode, config.pixKey ?? null]
    )
  }
}
