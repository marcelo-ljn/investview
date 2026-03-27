import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
    include: { positions: true },
  })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (portfolio.positions.length === 0) {
    return NextResponse.json({ positions: [], summary: { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0 } })
  }

  const tickers = portfolio.positions.map(p => p.ticker)
  const quotes = await fetchMultipleQuotes(tickers)
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

  const positions = portfolio.positions.map(p => {
    const quote = quoteMap.get(p.ticker)
    const currentPrice = quote?.regularMarketPrice ?? p.averagePrice
    const totalCost = p.quantity * p.averagePrice
    const currentValue = p.quantity * currentPrice
    const gain = currentValue - totalCost
    const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0

    return {
      ticker: p.ticker,
      assetType: p.assetType,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
      currentPrice,
      totalCost,
      currentValue,
      gain,
      gainPercent,
      changePercent: quote?.regularMarketChangePercent ?? 0,
      name: quote?.shortName ?? p.ticker,
      logoUrl: quote?.logourl,
    }
  })

  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0)
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Add weight
  const positionsWithWeight = positions.map(p => ({
    ...p,
    weight: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
  }))

  return NextResponse.json({
    positions: positionsWithWeight,
    summary: { totalValue, totalCost, totalGain, totalGainPercent },
  })
}
