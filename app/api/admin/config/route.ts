import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { getFinancialSettings, saveFinancialSettings, getAsaasConfig, saveAsaasConfig } from "@/lib/repos/finance"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  if (type === "asaas") return NextResponse.json({ data: await getAsaasConfig() })
  if (type === "financial") return NextResponse.json({ data: await getFinancialSettings() })

  const [financial, asaas] = await Promise.all([getFinancialSettings(), getAsaasConfig()])
  return NextResponse.json({ financial, asaas })
}

export async function POST(req: Request) {
  const u = await requireUser(req, ["master", "secretary"])
  if ("error" in u) return u.error
  const { type, config } = await req.json().catch(() => ({}))

  if (type === "asaas") {
    if (!config?.apiKey || !config?.mode) {
      return NextResponse.json({ error: "Chave de API e modo são obrigatórios." }, { status: 400 })
    }
    await saveAsaasConfig(config)
  } else if (type === "financial") {
    if (!config) return NextResponse.json({ error: "Configuração inválida." }, { status: 400 })
    await saveFinancialSettings(config)
  } else {
    return NextResponse.json({ error: "Tipo de configuração inválido." }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
