import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"

const MARKET_TYPES = ["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO"]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
    include: { positions: true },
  })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (portfolio.positions.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No positions" })
  }

  // Fetch live prices for market assets
  const marketTickers = portfolio.positions
    .filter(p => MARKET_TYPES.includes(p.assetType))
    .map(p => p.ticker)

  const quotes = marketTickers.length > 0 ? await fetchMultipleQuotes(marketTickers) : []
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

  let totalValue = 0
  let totalCost = 0

  for (const pos of portfolio.positions) {
    const isMarket = MARKET_TYPES.includes(pos.assetType)
    const quote = isMarket ? quoteMap.get(pos.ticker) : undefined
    const currentPrice = isMarket ? (quote?.regularMarketPrice ?? pos.averagePrice) : pos.averagePrice
    totalValue += pos.quantity * currentPrice
    totalCost += pos.quantity * pos.averagePrice
  }

  // Upsert snapshot for today (one per day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const snapshot = await prisma.portfolioSnapshot.upsert({
    where: { portfolioId_date: { portfolioId: id, date: today } },
    update: { totalValue, totalCost },
    create: { portfolioId: id, date: today, totalValue, totalCost },
  })

  return NextResponse.json({ snapshot })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") ?? "365")

  const portfolio = await prisma.portfolio.findFirst({ where: { id, userId: session.user.id } })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const since = new Date()
  since.setDate(since.getDate() - days)

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { portfolioId: id, date: { gte: since } },
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ snapshots })
}
