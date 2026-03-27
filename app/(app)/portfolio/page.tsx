import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { fetchMultipleQuotes } from "@/lib/brapi"
import { Card, CardContent } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatPercent, variationColor } from "@/lib/utils"
import { AddTransactionDialog } from "@/components/features/portfolio/add-transaction-dialog"
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
    name: string; logoUrl?: string | null; weight: number;
  }> = []
  let summary = { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0 }

  if (!isEmpty) {
    const tickers = portfolio.positions.map(p => p.ticker)
    const quotes = await fetchMultipleQuotes(tickers)
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

    positions = portfolio.positions.map(p => {
      const quote = quoteMap.get(p.ticker)
      const currentPrice = quote?.regularMarketPrice ?? p.averagePrice
      const totalCost = p.quantity * p.averagePrice
      const currentValue = p.quantity * currentPrice
      const gain = currentValue - totalCost
      const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0
      return {
        ticker: p.ticker, assetType: p.assetType, quantity: p.quantity,
        averagePrice: p.averagePrice, currentPrice, totalCost, currentValue,
        gain, gainPercent, changePercent: quote?.regularMarketChangePercent ?? 0,
        name: quote?.shortName ?? p.ticker, logoUrl: quote?.logourl, weight: 0,
      }
    })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{portfolio.name}</h1>
          <p className="text-muted-foreground">Acompanhe seus investimentos em tempo real</p>
        </div>
        <AddTransactionDialog portfolioId={portfolio.id} />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {positions.map(p => (
                    <tr key={p.ticker} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Link href={p.assetType === "FII" ? `/fiis/${p.ticker}` : `/acoes/${p.ticker}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                          {p.logoUrl && (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                              <Image src={p.logoUrl} alt={p.ticker} width={32} height={32} className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{p.ticker}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{p.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-right tabular-nums">{p.quantity.toFixed(p.quantity % 1 === 0 ? 0 : 3)}</td>
                      <td className="p-4 text-right tabular-nums">{formatCurrency(p.averagePrice)}</td>
                      <td className="p-4 text-right tabular-nums font-medium">{formatCurrency(p.currentPrice)}</td>
                      <td className="p-4 text-right"><VariationBadge value={p.changePercent} size="sm" /></td>
                      <td className="p-4 text-right tabular-nums hidden md:table-cell">{formatCurrency(p.currentValue)}</td>
                      <td className={`p-4 text-right tabular-nums hidden lg:table-cell ${variationColor(p.gain)}`}>
                        {p.gain >= 0 ? "+" : ""}{formatCurrency(p.gain)}
                      </td>
                      <td className="p-4 text-right hidden lg:table-cell">
                        <VariationBadge value={p.gainPercent} size="sm" />
                      </td>
                      <td className="p-4 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                        {p.weight.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
