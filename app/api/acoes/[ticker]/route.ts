import { NextRequest, NextResponse } from "next/server"
import { fetchQuote, fetchHistory, fetchDividends } from "@/lib/brapi"

export const revalidate = 300

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const upper = ticker.toUpperCase()
  const [quote, history, dividends] = await Promise.all([
    fetchQuote(upper),
    fetchHistory(upper, "1y", "1d"),
    fetchDividends(upper),
  ])
  if (!quote) return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 })
  return NextResponse.json({ quote, history, dividends })
}
