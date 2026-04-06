/**
 * Admin migration endpoint — protected by NextAuth session (no CRON_SECRET needed).
 * Used to backfill CDI history and set indexer/rate on positions/transactions in production.
 *
 * GET /api/admin/migrate
 *   ?step=backfill   — fetch CDI daily rates from BCB and upsert into EconomicRate
 *   ?step=indexer    — update RF/OTHER positions and transactions with indexer+rate by ticker name
 *   ?step=all        — run both steps (default)
 *   &from=YYYY-MM-DD — backfill start date (default: 2025-10-01)
 *   &to=YYYY-MM-DD   — backfill end date (default: today)
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseBCBDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/")
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  date.setHours(0, 0, 0, 0)
  return date
}

function formatBCBDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

async function backfillCDI(fromDate: Date, toDate: Date) {
  const from = formatBCBDate(fromDate)
  const to = formatBCBDate(toDate)
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?dataInicial=${from}&dataFinal=${to}&formato=json`

  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return { error: `BCB API ${res.status}`, url }

  const data: { data: string; valor: string }[] = await res.json()
  if (!Array.isArray(data) || data.length === 0) return { error: "No data from BCB", url }

  let upserted = 0
  for (const record of data) {
    const date = parseBCBDate(record.data)
    const value = parseFloat(record.valor)
    await prisma.economicRate.upsert({
      where: { name_date: { name: "CDI", date } },
      update: { value },
      create: { name: "CDI", date, value, source: "BCB" },
    })
    upserted++
  }
  return { upserted, from, to }
}

/**
 * Map ticker name substrings → { indexer, rate }.
 * Longer / more specific patterns must come FIRST.
 */
const TICKER_INDEXER_MAP: Array<{ pattern: string | RegExp; indexer: string; rate: number }> = [
  { pattern: /150%\s*CDI/i,                       indexer: "CDI", rate: 150 },
  { pattern: /120%\s*CDI/i,                       indexer: "CDI", rate: 120 },
  { pattern: /115%\s*CDI/i,                       indexer: "CDI", rate: 115 },
  { pattern: /112%\s*CDI/i,                       indexer: "CDI", rate: 112 },
  { pattern: /111%\s*CDI/i,                       indexer: "CDI", rate: 111 },
  { pattern: /110%\s*CDI/i,                       indexer: "CDI", rate: 110 },
  { pattern: /109%\s*CDI/i,                       indexer: "CDI", rate: 109 },
  { pattern: /108%\s*CDI/i,                       indexer: "CDI", rate: 108 },
  { pattern: /107%\s*CDI/i,                       indexer: "CDI", rate: 107 },
  { pattern: /106%\s*CDI/i,                       indexer: "CDI", rate: 106 },
  { pattern: /105%\s*CDI/i,                       indexer: "CDI", rate: 105 },
  { pattern: /100%\s*CDI/i,                       indexer: "CDI", rate: 100 },
  { pattern: /90%\s*CDI/i,                        indexer: "CDI", rate: 90  },
  { pattern: /87%\s*CDI/i,                        indexer: "CDI", rate: 87  },
  { pattern: /85%\s*CDI/i,                        indexer: "CDI", rate: 85  },
  { pattern: /84%\s*CDI/i,                        indexer: "CDI", rate: 84  },
  { pattern: /80%\s*CDI/i,                        indexer: "CDI", rate: 80  },
  // PREFIXADO — look for "24.5" or "14.5" or generic pré/pre
  { pattern: /24[.,]5/,                            indexer: "PREFIXADO", rate: 24.5 },
  { pattern: /14[.,]5/,                            indexer: "PREFIXADO", rate: 14.5 },
  { pattern: /Empr[ée]stimo/i,                     indexer: "PREFIXADO", rate: 14.5 },
  { pattern: /Tesouro\s+Selic/i,                   indexer: "SELIC",     rate: 100  },
  { pattern: /Tesouro\s+IPCA/i,                    indexer: "IPCA_PLUS", rate: 0    },
  { pattern: /Tesouro\s+Pr[eé]/i,                  indexer: "PREFIXADO", rate: 13   },
  { pattern: /Poupan[cç]a/i,                       indexer: "SELIC",     rate: 70   },
]

function matchTicker(ticker: string): { indexer: string; rate: number } | null {
  for (const entry of TICKER_INDEXER_MAP) {
    const pat = typeof entry.pattern === "string"
      ? ticker.toLowerCase().includes(entry.pattern.toLowerCase())
      : entry.pattern.test(ticker)
    if (pat) return { indexer: entry.indexer, rate: entry.rate }
  }
  return null
}

async function applyIndexerToPositions() {
  const positions = await prisma.position.findMany({
    where: { assetType: { in: ["FIXED_INCOME", "OTHER"] }, indexer: null },
  })

  let updated = 0
  const skipped: string[] = []

  for (const pos of positions) {
    const match = matchTicker(pos.ticker)
    if (!match) { skipped.push(pos.ticker); continue }
    await prisma.position.update({
      where: { id: pos.id },
      data: { indexer: match.indexer as any, rate: match.rate },
    })
    updated++
  }

  // Also update transactions without indexer
  const txs = await prisma.transaction.findMany({
    where: { assetType: { in: ["FIXED_INCOME", "OTHER"] }, indexer: null },
  })
  let txUpdated = 0
  for (const tx of txs) {
    const match = matchTicker(tx.ticker)
    if (!match) continue
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { indexer: match.indexer as any, rate: match.rate },
    })
    txUpdated++
  }

  return { positionsUpdated: updated, transactionsUpdated: txUpdated, skipped }
}

async function debugCDI(userId: string) {
  // Find first RF/OTHER position with indexer for this user
  const pos = await prisma.position.findFirst({
    where: {
      assetType: { in: ["FIXED_INCOME", "OTHER"] },
      indexer: { not: null },
      portfolio: { userId },
    },
    include: { portfolio: true },
  })
  if (!pos) return { error: "No position with indexer found" }

  // Get investedAt (first BUY transaction)
  const firstBuy = await prisma.transaction.findFirst({
    where: { portfolioId: pos.portfolioId, ticker: pos.ticker, type: "BUY" },
    orderBy: { date: "asc" },
  })

  // Count CDI records in DB
  const cdiTotal = await prisma.economicRate.count({ where: { name: "CDI" } })

  // Query CDI rates for this position's date range
  const now = new Date()
  const cdiRates = firstBuy ? await prisma.economicRate.findMany({
    where: { name: "CDI", date: { gte: firstBuy.date, lte: now } },
    orderBy: { date: "asc" },
    take: 3,
  }) : []

  // Also get latest CDI records from DB regardless of date filter
  const latestCDI = await prisma.economicRate.findMany({
    where: { name: "CDI" },
    orderBy: { date: "desc" },
    take: 3,
  })

  return {
    position: { ticker: pos.ticker, indexer: pos.indexer, rate: pos.rate, averagePrice: pos.averagePrice },
    firstBuyDate: firstBuy?.date ?? null,
    firstBuyDateRaw: firstBuy ? JSON.stringify(firstBuy.date) : null,
    nowRaw: JSON.stringify(now),
    cdiTotalInDB: cdiTotal,
    cdiRatesForRange: cdiRates.map(r => ({ date: r.date, dateRaw: JSON.stringify(r.date), value: r.value })),
    latestCDIInDB: latestCDI.map(r => ({ date: r.date, dateRaw: JSON.stringify(r.date), value: r.value })),
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const step = searchParams.get("step") ?? "all"
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const fromDate = fromParam ? new Date(fromParam) : new Date("2025-10-01")
  const toDate = toParam ? new Date(toParam) : new Date()

  const result: Record<string, unknown> = {}

  if (step === "debug") {
    result.debug = await debugCDI(session.user.id)
    return NextResponse.json({ ok: true, ...result })
  }

  if (step === "backfill" || step === "all") {
    result.backfill = await backfillCDI(fromDate, toDate)
  }

  if (step === "indexer" || step === "all") {
    result.indexer = await applyIndexerToPositions()
  }

  return NextResponse.json({ ok: true, ...result })
}
