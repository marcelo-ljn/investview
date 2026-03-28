"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatPercent, variationColor } from "@/lib/utils"
import { AllocationChart } from "./allocation-chart"
import { DividendProjection } from "./dividend-projection"
import { PerformanceChart } from "./performance-chart"
import { ProjectionTab } from "./projection-tab"
import { TransactionsTab } from "./transactions-tab"
import { TrendingUp, DollarSign, BarChart3, Target, LayoutList, LineChart, TrendingDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Position {
  ticker: string; assetType: string; quantity: number; averagePrice: number;
  currentPrice: number; totalCost: number; currentValue: number;
  gain: number; gainPercent: number; changePercent: number;
  name: string; logoUrl?: string | null; weight: number; dividendsYield?: number | null;
}

interface Transaction {
  id: string; ticker: string; assetType: string; type: string;
  date: string | Date; quantity: number; price: number; fees: number; notes?: string | null;
}

interface Snapshot { date: string | Date; totalValue: number; totalCost: number }

interface Summary { totalValue: number; totalCost: number; totalGain: number; totalGainPercent: number }

interface Portfolio {
  id: string; name: string; goalValue: number | null; notes: string | null;
}

interface PortfolioTabsProps {
  portfolio: Portfolio
  positions: Position[]
  transactions: Transaction[]
  snapshots: Snapshot[]
  summary: Summary
  isEmpty: boolean
  actions: React.ReactNode
  emptyState: React.ReactNode
}

const TABS = [
  { key: "resumo", label: "Resumo", icon: BarChart3 },
  { key: "rentabilidade", label: "Rentabilidade", icon: LineChart },
  { key: "projecao", label: "Projeção", icon: TrendingUp },
  { key: "lancamentos", label: "Lançamentos", icon: LayoutList },
]

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

export function PortfolioTabs({
  portfolio, positions, transactions, snapshots, summary, isEmpty, actions, emptyState
}: PortfolioTabsProps) {
  const [tab, setTab] = useState("resumo")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{portfolio.name}</h1>
          <p className="text-muted-foreground text-sm">Acompanhe e projete seus investimentos</p>
        </div>
        <div className="flex gap-2 sm:ml-auto flex-wrap">{actions}</div>
      </div>

      {isEmpty ? (
        emptyState
      ) : (
        <>
          {/* Summary cards — always visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Patrimônio", value: formatCurrency(summary.totalValue), icon: DollarSign, color: "text-blue-500 bg-blue-500/10", v: null },
              { label: "Custo investido", value: formatCurrency(summary.totalCost), icon: DollarSign, color: "text-zinc-400 bg-zinc-400/10", v: null },
              { label: "Resultado", value: formatCurrency(summary.totalGain), icon: summary.totalGain >= 0 ? TrendingUp : TrendingDown, color: summary.totalGain >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10", v: summary.totalGain },
              { label: "Rentabilidade", value: formatPercent(summary.totalGainPercent), icon: BarChart3, color: summary.totalGainPercent >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10", v: summary.totalGainPercent },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`rounded-lg p-2 shrink-0 ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className={`text-lg font-bold tabular-nums truncate ${stat.v !== null ? variationColor(stat.v) : ""}`}>
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
                  <span className="font-medium flex items-center gap-1.5"><Target className="h-4 w-4" /> Meta patrimonial</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(summary.totalValue)} / {formatCurrency(portfolio.goalValue)}
                    {" "}({Math.min((summary.totalValue / portfolio.goalValue) * 100, 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((summary.totalValue / portfolio.goalValue) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      tab === t.key
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          {tab === "resumo" && (
            <div className="space-y-6">
              {/* Evolution chart */}
              {snapshots.length >= 2 && (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm font-medium mb-4">Evolução patrimonial</p>
                    <PerformanceChart snapshots={snapshots} />
                  </CardContent>
                </Card>
              )}

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
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium">Posições ({positions.length})</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Ativo</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Qtd.</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">P. Médio / Custo</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Cotação / Saldo</th>
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
                            <td className="p-4 text-right tabular-nums text-xs">
                              {isMarket
                                ? formatCurrency(p.averagePrice)
                                : <span className="tabular-nums">{formatCurrency(p.averagePrice)}</span>}
                            </td>
                            <td className="p-4 text-right tabular-nums text-xs font-medium">
                              {isMarket ? formatCurrency(p.currentPrice) : <span className="tabular-nums">{formatCurrency(p.currentValue)}</span>}
                            </td>
                            <td className="p-4 text-right">
                              {isMarket ? <VariationBadge value={p.changePercent} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="p-4 text-right tabular-nums text-xs hidden md:table-cell">{formatCurrency(p.currentValue)}</td>
                            <td className={`p-4 text-right tabular-nums text-xs hidden lg:table-cell ${variationColor(p.gain)}`}>
                              {p.gain !== 0 ? `${p.gain >= 0 ? "+" : ""}${formatCurrency(p.gain)}` : "—"}
                            </td>
                            <td className="p-4 text-right hidden lg:table-cell">
                              {p.gainPercent !== 0 ? <VariationBadge value={p.gainPercent} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="p-4 text-right tabular-nums text-xs text-muted-foreground hidden lg:table-cell">
                              {p.weight.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {tab === "rentabilidade" && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium mb-4">Evolução patrimonial</p>
                  <PerformanceChart snapshots={snapshots} />
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Rentabilidade total</p>
                    <p className={`text-2xl font-bold ${variationColor(summary.totalGainPercent)}`}>
                      {formatPercent(summary.totalGainPercent)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Resultado em R$</p>
                    <p className={`text-2xl font-bold ${variationColor(summary.totalGain)}`}>
                      {summary.totalGain >= 0 ? "+" : ""}{formatCurrency(summary.totalGain)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Lançamentos registrados</p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compras: {transactions.filter(t => t.type === "BUY").length} ·
                      Vendas: {transactions.filter(t => t.type === "SELL").length} ·
                      Proventos: {transactions.filter(t => t.type === "DIVIDEND" || t.type === "JCP").length}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {snapshots.length < 2 && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    O gráfico de evolução acumula dados a cada acesso à carteira. Volte amanhã para ver a linha de evolução.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === "projecao" && (
            <ProjectionTab currentValue={summary.totalValue} currentCost={summary.totalCost} />
          )}

          {tab === "lancamentos" && (
            <TransactionsTab transactions={transactions} portfolioId={portfolio.id} />
          )}
        </>
      )}
    </div>
  )
}
