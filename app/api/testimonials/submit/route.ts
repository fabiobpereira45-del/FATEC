import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { uploadToBlob, UploadError } from "@/lib/blob"

// Pública: formulário "conte sua experiência". Entra como não publicado,
// o master revisa e publica pelo painel.
export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const name = (form.get("name") as string | null)?.trim()
    const role = (form.get("role") as string | null)?.trim() || null
    const polo = (form.get("polo") as string | null)?.trim() || null
    const quote = (form.get("quote") as string | null)?.trim()
    const photo = form.get("photo") as File | null

    if (!name || !quote) {
      return NextResponse.json({ error: "Nome e depoimento são obrigatórios." }, { status: 400 })
    }
    if (name.length > 120 || quote.length > 2000) {
      return NextResponse.json({ error: "Texto muito longo." }, { status: 400 })
    }

    let photoUrl: string | null = null
    if (photo && photo.size > 0) {
      try {
        photoUrl = await uploadToBlob(photo, "testimonials", "testimonial")
      } catch (err: any) {
        const status = err instanceof UploadError ? 400 : 500
        return NextResponse.json({ error: err.message || "Erro ao enviar foto." }, { status })
      }
    }

    const { rows } = await pool.query("select max(order_index) as n from testimonials")
    const nextOrder = (rows[0]?.n ?? -1) + 1

    await pool.query(
      `insert into testimonials (name, role, polo, quote, photo_url, is_published, order_index)
       values ($1,$2,$3,$4,$5,false,$6)`,
      [name, role, polo, quote, photoUrl, nextOrder]
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro inesperado." }, { status: 500 })
  }
}
