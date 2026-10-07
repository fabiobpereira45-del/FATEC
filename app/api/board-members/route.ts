import { NextResponse } from "next/server"
import { listBoardMembers } from "@/lib/repos/board"

// Pública: exibida na página institucional.
export async function GET() {
  return NextResponse.json(await listBoardMembers())
}
