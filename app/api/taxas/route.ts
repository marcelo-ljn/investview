import { NextResponse } from "next/server"
import { fetchAllRates } from "@/lib/bcb"

export const revalidate = 3600 // 1h

export async function GET() {
  const rates = await fetchAllRates()
  return NextResponse.json(rates)
}
