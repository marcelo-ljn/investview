import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"
import { fetchAllRates } from "@/lib/bcb"
import { calcAccumulatedValue, getInvestedAt } from "@/lib/calc-accumulated"

const VALUE_BASED = ["FIXED_INCOME", "OTHER"]

function calcEffectiveRate(
  indexer: string | null | undefined,
  rate: number | null | undefined,
  bcbRates: { cdi: number; selic: number; ipca: number; igpm: number },
): number | null {
  if (!indexer || rate == null) return null
  switch (indexer) {
    case "CDI":       return bcbRates.cdi * (rate / 100)
    case "CDI_PLUS":  return bcbRates.cdi + rate
    case "SELIC":     return bcbRates.selic * (rate / 100)
    case "IPCA":      return bcbRates.ipca + rate
    case "IPCA_PLUS": return bcbRates.ipca + rate
    case "IGPM":      return bcbRates.igpm + rate
    case "PREFIXADO": return rate
    default:          return null
  }
}

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

  // Only fetch market quotes for non-VALUE_BASED positions (they don't have tickers in BRAPI)
  const marketTickers = portfolio.positions
    .filter(p => !VALUE_BASED.includes(p.assetType))
    .map(p => p.ticker)

  const [quotes, bcbRates] = await Promise.all([
    marketTickers.length > 0 ? fetchMultipleQuotes(marketTickers) : Promise.resolve([]),
    fetchAllRates(),
  ])
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

  const positions = await Promise.all(portfolio.positions.map(async (p) => {
    const isValueBased = VALUE_BASED.includes(p.assetType)

    let currentValue: number
    let totalCost: number
    let currentPrice: number
    let changePercent: number
    let name: string
    let logoUrl: string | null | undefined
    let accumulatedValue: number | null = null

    if (isValueBased) {
      // quantity = saldo atual em BRL (current value)
      // averagePrice = custo original em BRL (cost basis)
      currentValue = p.quantity
      totalCost = p.averagePrice
      currentPrice = p.quantity    // not meaningful, but set for consistency
      changePercent = 0
      name = p.ticker
      logoUrl = null

      // Calculate accumulated value if indexer is set
      if (p.indexer) {
        const investedAt = await getInvestedAt(id, p.ticker)
        if (investedAt) {
          accumulatedValue = await calcAccumulatedValue(
            totalCost,
            investedAt,
            p.indexer,
            p.rate
          )
          // Use accumulated value as current value if available
          currentValue = accumulatedValue
        }
      }
    } else {
      const quote = quoteMap.get(p.ticker)
      currentPrice = quote?.regularMarketPrice ?? p.averagePrice
      totalCost = p.quantity * p.averagePrice
      currentValue = p.quantity * currentPrice
      changePercent = quote?.regularMarketChangePercent ?? 0
      name = quote?.shortName ?? p.ticker
      logoUrl = quote?.logourl
    }

    const gain = currentValue - totalCost
    const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0
    const effectiveAnnualRate = calcEffectiveRate(p.indexer, p.rate, bcbRates)

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
      changePercent,
      name,
      logoUrl,
      indexer: p.indexer,
      rate: p.rate,
      effectiveAnnualRate,
      accumulatedValue,
    }
  }))

  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0)
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const positionsWithWeight = positions.map(p => ({
    ...p,
    weight: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0,
  }))

  return NextResponse.json({
    positions: positionsWithWeight,
    summary: { totalValue, totalCost, totalGain, totalGainPercent },
  })
}

// DELETE: wipe all (or just one assetType) — ?assetType=FIXED_INCOME for scoped reset
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const portfolio = await prisma.portfolio.findFirst({ where: { id, userId: session.user.id } })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const assetType = searchParams.get("assetType")

  if (assetType) {
    // Scoped reset: delete only transactions of this assetType, then rebuild all positions
    await prisma.transaction.deleteMany({ where: { portfolioId: id, assetType: assetType as any } })
    await prisma.position.deleteMany({ where: { portfolioId: id } })

    // Rebuild from remaining transactions
    const { applyTransactionToPosition } = await import("@/lib/portfolio-position")
    const remaining = await prisma.transaction.findMany({
      where: { portfolioId: id },
      orderBy: { date: "asc" },
    })
    for (const tx of remaining) {
      await applyTransactionToPosition(id, tx)
    }
  } else {
    // Full reset
    await prisma.transaction.deleteMany({ where: { portfolioId: id } })
    await prisma.position.deleteMany({ where: { portfolioId: id } })
    await prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: id } })
  }

  return NextResponse.json({ ok: true })
}
