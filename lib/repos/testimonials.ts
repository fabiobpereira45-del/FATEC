import { pool } from "@/lib/db"

export interface TestimonialInput {
  name: string
  role?: string | null
  polo?: string | null
  quote: string
  photoUrl?: string | null
  isPublished?: boolean
  order?: number
}

function toTestimonial(r: any) {
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? undefined,
    polo: r.polo ?? undefined,
    quote: r.quote,
    photoUrl: r.photo_url ?? null,
    isPublished: !!r.is_published,
    order: r.order_index,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function listTestimonials(publishedOnly: boolean) {
  const sql = publishedOnly
    ? "select * from testimonials where is_published = true order by order_index asc"
    : "select * from testimonials order by order_index asc"
  const { rows } = await pool.query(sql)
  return rows.map(toTestimonial)
}

export async function createTestimonial(input: TestimonialInput) {
  const { rows } = await pool.query(
    `insert into testimonials (name, role, polo, quote, photo_url, is_published, order_index)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [input.name, input.role || null, input.polo || null, input.quote, input.photoUrl || null,
     input.isPublished ?? true, input.order ?? 0]
  )
  return toTestimonial(rows[0])
}

export async function updateTestimonial(id: string, data: Partial<TestimonialInput>) {
  const sets: string[] = []
  const vals: unknown[] = []
  const add = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
  if (data.name !== undefined) add("name", data.name)
  if (data.role !== undefined) add("role", data.role || null)
  if (data.polo !== undefined) add("polo", data.polo || null)
  if (data.quote !== undefined) add("quote", data.quote)
  if (data.photoUrl !== undefined) add("photo_url", data.photoUrl)
  if (data.isPublished !== undefined) add("is_published", data.isPublished)
  if (data.order !== undefined) add("order_index", data.order)
  if (sets.length === 0) return
  vals.push(id)
  await pool.query(`update testimonials set ${sets.join(", ")} where id = $${vals.length}::uuid`, vals)
}

export async function deleteTestimonial(id: string) {
  await pool.query("delete from testimonials where id = $1::uuid", [id])
}
