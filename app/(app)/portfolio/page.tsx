import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"
import { AddTransactionDialog } from "@/components/features/portfolio/add-transaction-dialog"
import { ImportCsvDialog } from "@/components/features/portfolio/import-csv-dialog"
import { PortfolioNotesDialog } from "@/components/features/portfolio/portfolio-notes-dialog"
import { PortfolioTabs } from "@/components/features/portfolio/portfolio-tabs"
import { BarChart3 } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Minha Carteira — InvestView" }

const MARKET_TYPES = ["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO"]

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Get or create default portfolio
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId: session.user.id, isDefault: true },
    include: { positions: true },
  })

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        name: "Minha Carteira",
        color: "#3B82F6",
        isDefault: true,
      },
      include: { positions: true },
    })
  }

  // Fetch transactions and snapshots in parallel
  const [transactions, snapshotData] = await Promise.all([
    prisma.transaction.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { date: "desc" },
    }),
    prisma.portfolioSnapshot.findMany({
      where: {
        portfolioId: portfolio.id,
        date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: "asc" },
    }),
  ])

  const isEmpty = portfolio.positions.length === 0

  let positions: Array<{
    ticker: string; assetType: string; quantity: number; averagePrice: number;
    currentPrice: number; totalCost: number; currentValue: number;
    gain: number; gainPercent: number; changePercent: number;
    name: string; logoUrl?: string | null; weight: number; dividendsYield?: number | null;
  }> = []
  let summary = { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0 }

  if (!isEmpty) {
    const marketTickers = portfolio.positions
      .filter(p => MARKET_TYPES.includes(p.assetType))
      .map(p => p.ticker)

    const quotes = marketTickers.length > 0 ? await fetchMultipleQuotes(marketTickers) : []
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

    positions = portfolio.positions.map(p => {
      const isMarket = MARKET_TYPES.includes(p.assetType)
      const quote = isMarket ? quoteMap.get(p.ticker) : undefined
      const currentPrice = isMarket ? (quote?.regularMarketPrice ?? p.averagePrice) : p.averagePrice
      const totalCost = p.quantity * p.averagePrice
      const currentValue = p.quantity * currentPrice
      const gain = currentValue - totalCost
      const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0
      return {
        ticker: p.ticker, assetType: p.assetType, quantity: p.quantity,
        averagePrice: p.averagePrice, currentPrice, totalCost, currentValue,
        gain, gainPercent, changePercent: quote?.regularMarketChangePercent ?? 0,
        name: quote?.shortName ?? p.ticker, logoUrl: quote?.logourl, weight: 0,
        dividendsYield: isMarket ? quote?.dividendsYield : undefined,
      }
    })

    const totalValue = positions.reduce((s, p) => s + p.currentValue, 0)
    const totalCost = positions.reduce((s, p) => s + p.totalCost, 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    summary = { totalValue, totalCost, totalGain, totalGainPercent }
    positions = positions.map(p => ({ ...p, weight: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0 }))
    positions.sort((a, b) => b.currentValue - a.currentValue)

    // Save today's snapshot (fire-and-forget, best-effort)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    prisma.portfolioSnapshot.upsert({
      where: { portfolioId_date: { portfolioId: portfolio.id, date: today } },
      update: { totalValue, totalCost },
      create: { portfolioId: portfolio.id, date: today, totalValue, totalCost },
    }).catch(() => {/* ignore */})
  }

  const portfolioData = {
    id: portfolio.id,
    name: portfolio.name,
    goalValue: portfolio.goalValue,
    notes: portfolio.notes,
  }

  const snapshots = snapshotData.map(s => ({
    date: s.date.toISOString(),
    totalValue: s.totalValue,
    totalCost: s.totalCost,
  }))

  const txSerialized = transactions.map(t => ({
    id: t.id,
    ticker: t.ticker,
    assetType: t.assetType,
    type: t.type,
    date: t.date.toISOString(),
    quantity: t.quantity,
    price: t.price,
    fees: t.fees,
    notes: t.notes,
  }))

  const actions = (
    <>
      <AddTransactionDialog portfolioId={portfolio.id} />
      <ImportCsvDialog portfolioId={portfolio.id} />
      <PortfolioNotesDialog portfolioId={portfolio.id} initialNotes={portfolio.notes} initialGoal={portfolio.goalValue} />
    </>
  )

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="rounded-full bg-primary/10 p-6">
        <BarChart3 className="h-12 w-12 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Nenhum ativo cadastrado</h2>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Adicione sua primeira operação ou importe o histórico de transações via CSV para começar.
        </p>
      </div>
      <div className="flex gap-3">
        <AddTransactionDialog portfolioId={portfolio.id} />
        <ImportCsvDialog portfolioId={portfolio.id} />
      </div>
    </div>
  )

  return (
    <PortfolioTabs
      portfolio={portfolioData}
      positions={positions}
      transactions={txSerialized}
      snapshots={snapshots}
      summary={summary}
      isEmpty={isEmpty}
      actions={actions}
      emptyState={emptyState}
    />
  )
}
