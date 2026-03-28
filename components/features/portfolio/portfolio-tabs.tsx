"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatPercent, variationColor } from "@/lib/utils"
import { TypeAllocationBar } from "./type-allocation-bar"
import { SwimlaneSection } from "./swimlane-section"
import { PerformanceChart } from "./performance-chart"
import { ProjectionTab } from "./projection-tab"
import { TransactionsTab } from "./transactions-tab"
import { TrendingUp, DollarSign, BarChart3, Target, LayoutList, LineChart, TrendingDown } from "lucide-react"

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

// ─── Rentabilidade tab ────────────────────────────────────────────────────────
function RentabilidadeTab({
  snapshots, positions, transactions, summary,
}: {
  snapshots: Snapshot[]
  positions: Position[]
  transactions: Transaction[]
  summary: Summary
}) {
  // Breakdown by asset type
  const typeBreakdown = SWIMLANE_ORDER.map(cfg => {
    const group = positions.filter(p => p.assetType === cfg.type)
    if (group.length === 0) return null
    const cost  = group.reduce((s, p) => s + p.totalCost,    0)
    const value = group.reduce((s, p) => s + p.currentValue, 0)
    const gain  = value - cost
    const pct   = cost > 0 ? (gain / cost) * 100 : 0
    return { ...cfg, cost, value, gain, pct }
  }).filter(Boolean) as Array<{ type: string; label: string; icon: string; color: string; cost: number; value: number; gain: number; pct: number }>

  // Top & worst performers (only market positions with actual gain data)
  const sorted = [...positions].filter(p => p.gainPercent !== 0).sort((a, b) => b.gainPercent - a.gainPercent)
  const top5   = sorted.slice(0, 5)
  const worst5 = sorted.filter(p => p.gainPercent < 0).slice(-5).reverse()

  return (
    <div className="space-y-6">
      {/* Evolution chart */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium mb-4">Evolução patrimonial</p>
          <PerformanceChart snapshots={snapshots} />
        </CardContent>
      </Card>

      {/* Summary cards */}
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
              Compras: {transactions.filter(t => t.type === "BUY").length} ·{" "}
              Vendas: {transactions.filter(t => t.type === "SELL").length} ·{" "}
              Proventos: {transactions.filter(t => t.type === "DIVIDEND" || t.type === "JCP").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {snapshots.length < 2 && (
        <p className="text-xs text-muted-foreground text-center">
          O gráfico de evolução acumula dados a cada acesso. Volte amanhã para ver a linha de evolução.
        </p>
      )}

      {/* Breakdown by type */}
      <Card>
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium">Rentabilidade por classe</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground text-xs">Classe</th>
                <th className="text-right p-3 font-medium text-muted-foreground text-xs">Investido</th>
                <th className="text-right p-3 font-medium text-muted-foreground text-xs">Valor atual</th>
                <th className="text-right p-3 font-medium text-muted-foreground text-xs">Resultado R$</th>
                <th className="text-right p-3 font-medium text-muted-foreground text-xs">%</th>
              </tr>
            </thead>
            <tbody>
              {typeBreakdown.map(row => (
                <tr key={row.type} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{row.icon}</span>
                      <span className="text-xs font-medium">{row.label}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right tabular-nums text-xs">{formatCurrency(row.cost)}</td>
                  <td className="p-3 text-right tabular-nums text-xs">{formatCurrency(row.value)}</td>
                  <td className={`p-3 text-right tabular-nums text-xs font-semibold ${variationColor(row.gain)}`}>
                    {row.gain >= 0 ? "+" : ""}{formatCurrency(row.gain)}
                  </td>
                  <td className="p-3 text-right">
                    <VariationBadge value={row.pct} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border">
                <td className="p-3 text-xs font-semibold">Total</td>
                <td className="p-3 text-right tabular-nums text-xs font-semibold">{formatCurrency(summary.totalCost)}</td>
                <td className="p-3 text-right tabular-nums text-xs font-semibold">{formatCurrency(summary.totalValue)}</td>
                <td className={`p-3 text-right tabular-nums text-xs font-semibold ${variationColor(summary.totalGain)}`}>
                  {summary.totalGain >= 0 ? "+" : ""}{formatCurrency(summary.totalGain)}
                </td>
                <td className="p-3 text-right">
                  <VariationBadge value={summary.totalGainPercent} size="sm" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Top & worst performers */}
      {(top5.length > 0 || worst5.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top5.length > 0 && (
            <Card>
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-emerald-500">↑ Melhores desempenhos</p>
              </div>
              <div className="divide-y divide-border">
                {top5.map(p => (
                  <div key={`${p.ticker}-${p.assetType}`} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate max-w-[160px]">{p.ticker}</p>
                      <p className="text-[10px] text-muted-foreground">{assetBadgeLabel[p.assetType] ?? p.assetType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold tabular-nums ${variationColor(p.gain)}`}>
                        {p.gain >= 0 ? "+" : ""}{formatCurrency(p.gain)}
                      </p>
                      <VariationBadge value={p.gainPercent} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {worst5.length > 0 && (
            <Card>
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-rose-500">↓ Piores desempenhos</p>
              </div>
              <div className="divide-y divide-border">
                {worst5.map(p => (
                  <div key={`${p.ticker}-${p.assetType}`} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate max-w-[160px]">{p.ticker}</p>
                      <p className="text-[10px] text-muted-foreground">{assetBadgeLabel[p.assetType] ?? p.assetType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold tabular-nums ${variationColor(p.gain)}`}>
                        {formatCurrency(p.gain)}
                      </p>
                      <VariationBadge value={p.gainPercent} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

const SWIMLANE_ORDER = [
  { type: "FIXED_INCOME", label: "Renda Fixa",  icon: "🏦", color: "#f43f5e" },
  { type: "STOCK",        label: "Ações BR",     icon: "📈", color: "#3b82f6" },
  { type: "FII",          label: "FIIs",         icon: "🏢", color: "#10b981" },
  { type: "ETF",          label: "ETFs",         icon: "📊", color: "#8b5cf6" },
  { type: "US_STOCK",     label: "Ações US",     icon: "🇺🇸", color: "#06b6d4" },
  { type: "CRYPTO",       label: "Cripto",       icon: "₿",  color: "#f59e0b" },
  { type: "OTHER",        label: "Outros",       icon: "📦", color: "#71717a" },
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
            <div className="space-y-4">
              {/* Allocation bar — full width */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">Patrimônio por classe</p>
                  <TypeAllocationBar positions={positions} totalValue={summary.totalValue} />
                </CardContent>
              </Card>

              {/* Swimlanes */}
              {SWIMLANE_ORDER.map(cfg => {
                const lane = positions.filter(p => p.assetType === cfg.type)
                if (lane.length === 0) return null
                return (
                  <SwimlaneSection
                    key={cfg.type}
                    assetType={cfg.type}
                    label={cfg.label}
                    icon={cfg.icon}
                    accentColor={cfg.color}
                    positions={lane}
                    totalValue={summary.totalValue}
                  />
                )
              })}
            </div>
          )}

          {tab === "rentabilidade" && (
            <RentabilidadeTab
              snapshots={snapshots}
              positions={positions}
              transactions={transactions}
              summary={summary}
            />
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
