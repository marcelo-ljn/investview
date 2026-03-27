import { NextRequest, NextResponse } from "next/server"
import { fetchMultipleQuotes, fetchTickerList } from "@/lib/brapi"

export const revalidate = 300 // 5 min

// Default top stocks to show
const DEFAULT_TICKERS = [
  "PETR4","VALE3","ITUB4","BBDC4","WEGE3","RENT3","ABEV3","B3SA3",
  "MGLU3","LREN3","JBSS3","BEEF3","HAPV3","PRIO3","EGIE3","TAEE11"
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tickers = searchParams.get("tickers")?.split(",") ?? DEFAULT_TICKERS
  const quotes = await fetchMultipleQuotes(tickers.slice(0, 20))
  return NextResponse.json({ quotes })
}
