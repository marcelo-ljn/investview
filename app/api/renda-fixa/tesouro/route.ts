import { NextResponse } from "next/server"
import { fetchTesouroBonds } from "@/lib/tesouro"

export const revalidate = 900 // 15 min

export async function GET() {
  const bonds = await fetchTesouroBonds()
  return NextResponse.json({ bonds })
}
