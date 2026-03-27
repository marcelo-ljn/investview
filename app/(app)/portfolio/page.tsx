import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"
import { Card, CardContent } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatPercent, variationColor } from "@/lib/utils"
import { AddTransactionDialog } from "@/components/features/portfolio/add-transaction-dialog"
import { AllocationChart } from "@/components/features/portfolio/allocation-chart"
import { DividendProjection } from "@/components/features/portfolio/dividend-projection"
import { PortfolioNotesDialog } from "@/components/features/portfolio/portfolio-notes-dialog"
import { ImportCsvDialog } from "@/components/features/portfolio/import-csv-dialog"
import { TrendingUp, DollarSign, BarChart3, PlusCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Portfolio" }

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

  const isEmpty = portfolio.positions.length === 0

  let positions: Array<{
    ticker: string; assetType: string; quantity: number; averagePrice: number;
    currentPrice: number; totalCost: number; currentValue: number;
    gain: number; gainPercent: number; changePercent: number;
    name: string; logoUrl?: string | null; weight: number; dividendsYield?: number | null;
  }> = []
  let summary = { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0 }

  if (!isEmpty) {
    // Only fetch market quotes for ticker-based assets
    const MARKET_TYPES = ["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO"]
    const marketPositions = portfolio.positions.filter(p => MARKET_TYPES.includes(p.assetType))
    const manualPositions = portfolio.positions.filter(p => !MARKET_TYPES.includes(p.assetType))

    const tickers = marketPositions.map(p => p.ticker)
    const quotes = tickers.length > 0 ? await fetchMultipleQuotes(tickers) : []
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

    positions = portfolio.positions.map(p => {
      const isMarket = MARKET_TYPES.includes(p.assetType)
      const quote = isMarket ? quoteMap.get(p.ticker) : undefined
      // For manual assets (fixed income, other): currentPrice = averagePrice (stored value)
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
    // suppress unused variable warning
    void manualPositions

    const totalValue = positions.reduce((s, p) => s + p.currentValue, 0)
    const totalCost = positions.reduce((s, p) => s + p.totalCost, 0)
    const totalGain = totalValue - totalCost
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
    summary = { totalValue, totalCost, totalGain, totalGainPercent }
    positions = positions.map(p => ({ ...p, weight: totalValue > 0 ? (p.currentValue / totalValue) * 100 : 0 }))
    positions.sort((a, b) => b.currentValue - a.currentValue)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{portfolio.name}</h1>
          <p className="text-muted-foreground">Acompanhe seus investimentos em tempo real</p>
        </div>
        <div className="flex gap-2 sm:ml-auto flex-wrap">
          <AddTransactionDialog portfolioId={portfolio.id} />
          <ImportCsvDialog portfolioId={portfolio.id} />
          <PortfolioNotesDialog portfolioId={portfolio.id} initialNotes={portfolio.notes} initialGoal={portfolio.goalValue} />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Nenhum ativo cadastrado</h2>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Adicione sua primeira operação para começar a acompanhar o desempenho
            </p>
          </div>
          <AddTransactionDialog portfolioId={portfolio.id} />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Patrimônio total", value: formatCurrency(summary.totalValue), icon: DollarSign, color: "text-blue-500 bg-blue-500/10" },
              { label: "Custo total", value: formatCurrency(summary.totalCost), icon: DollarSign, color: "text-zinc-400 bg-zinc-400/10" },
              { label: "Resultado total", value: formatCurrency(summary.totalGain), icon: TrendingUp, color: summary.totalGain >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10" },
              { label: "Rentabilidade", value: formatPercent(summary.totalGainPercent), icon: BarChart3, color: summary.totalGainPercent >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10" },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-5 flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={`text-xl font-bold tabular-nums ${stat.label.includes("Resultado") || stat.label.includes("Rentabilidade") ? variationColor(summary.totalGain) : ""}`}>
                        {stat.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Goal progress */}
          {portfolio.goalValue && portfolio.goalValue > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Meta patrimonial</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(summary.totalValue)} / {formatCurrency(portfolio.goalValue)}
                    {" "}({Math.min((summary.totalValue / portfolio.goalValue) * 100, 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((summary.totalValue / portfolio.goalValue) * 100, 100)}%` }}
                  />
                </div>
                {portfolio.notes && (
                  <p className="text-xs text-muted-foreground mt-3 whitespace-pre-wrap">{portfolio.notes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium mb-4">Alocação</p>
                <AllocationChart positions={positions} totalValue={summary.totalValue} />
              </CardContent>
            </Card>
            <DividendProjection positions={positions} />
          </div>

          {/* Positions table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Ativo</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Qtd.</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">P. Médio</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Cotação</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Hoje</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Valor</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">Resultado</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">%</th>
                    <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const isMarket = ["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO"].includes(p.assetType)
                    const href = p.assetType === "FII" ? `/fiis/${p.ticker}` : p.assetType === "ETF" ? `/etfs/${p.ticker}` : `/acoes/${p.ticker}`
                    const assetBadgeColor: Record<string, string> = {
                      STOCK: "bg-blue-500/10 text-blue-400",
                      FII: "bg-emerald-500/10 text-emerald-400",
                      ETF: "bg-violet-500/10 text-violet-400",
                      US_STOCK: "bg-sky-500/10 text-sky-400",
                      CRYPTO: "bg-amber-500/10 text-amber-400",
                      FIXED_INCOME: "bg-rose-500/10 text-rose-400",
                      OTHER: "bg-zinc-500/10 text-zinc-400",
                    }
                    const assetBadgeLabel: Record<string, string> = {
                      STOCK: "Ação", FII: "FII", ETF: "ETF", US_STOCK: "US",
                      CRYPTO: "Cripto", FIXED_INCOME: "RF", OTHER: "Outro",
                    }
                    return (
                      <tr key={`${p.ticker}-${p.assetType}`} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.logoUrl ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                                <Image src={p.logoUrl} alt={p.ticker} width={32} height={32} className="object-cover" />
                              </div>
                            ) : (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${assetBadgeColor[p.assetType] ?? "bg-muted text-muted-foreground"}`}>
                                {assetBadgeLabel[p.assetType] ?? p.assetType}
                              </span>
                            )}
                            <div>
                              {isMarket ? (
                                <Link href={href} className="font-semibold hover:text-primary transition-colors">
                                  {p.ticker}
                                </Link>
                              ) : (
                                <p className="font-semibold text-xs leading-tight max-w-[160px]">{p.ticker}</p>
                              )}
                              {isMarket && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{p.name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right tabular-nums text-xs">
                          {isMarket ? p.quantity.toFixed(p.quantity % 1 === 0 ? 0 : 3) : "—"}
                        </td>
                        <td className="p-4 text-right tabular-nums">{formatCurrency(p.averagePrice)}</td>
                        <td className="p-4 text-right tabular-nums font-medium">
                          {isMarket ? formatCurrency(p.currentPrice) : "—"}
                        </td>
                        <td className="p-4 text-right">
                          {isMarket ? <VariationBadge value={p.changePercent} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 text-right tabular-nums hidden md:table-cell">{formatCurrency(p.currentValue)}</td>
                        <td className={`p-4 text-right tabular-nums hidden lg:table-cell ${variationColor(p.gain)}`}>
                          {p.gain !== 0 ? `${p.gain >= 0 ? "+" : ""}${formatCurrency(p.gain)}` : "—"}
                        </td>
                        <td className="p-4 text-right hidden lg:table-cell">
                          {isMarket ? <VariationBadge value={p.gainPercent} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                          {p.weight.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
