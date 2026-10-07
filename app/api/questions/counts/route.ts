import { NextResponse } from "next/server"
import { requireUser } from "@/lib/api-auth"
import { questionCounts } from "@/lib/repos/questions"

export async function GET(req: Request) {
  const u = await requireUser(req, ["master", "professor", "secretary"])
  if ("error" in u) return u.error
  return NextResponse.json(await questionCounts())
}
