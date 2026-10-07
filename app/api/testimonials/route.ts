import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { listTestimonials, createTestimonial } from "@/lib/repos/testimonials"

// Pública quando só pede os publicados (landing page).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const publishedOnly = searchParams.get("all") !== "1"
  if (!publishedOnly) {
    const u = await requireUser(req, ["master", "secretary"])
    if ("error" in u) return u.error
  }
  return NextResponse.json(await listTestimonials(publishedOnly))
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.quote) return NextResponse.json({ error: "Nome e depoimento são obrigatórios." }, { status: 400 })
  return NextResponse.json(await createTestimonial(body), { status: 201 })
}
