"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { formatCurrency, formatPercent, variationColor } from "@/lib/utils"
import { VariationBadge } from "@/components/ui/variation-badge"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Position {
  ticker: string
  assetType: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalCost: number
  currentValue: number
  gain: number
  gainPercent: number
  changePercent: number
  name: string
  logoUrl?: string | null
  weight: number
}

interface Props {
  assetType: string
  label: string
  icon: string
  accentColor: string
  positions: Position[]
  totalValue: number
  firstTxDate?: string
}

type Period = "monthly" | "quarterly" | "annual"

const ANNUAL_RATES: Record<string, number> = {
  FIXED_INCOME: 0.13,
  STOCK:        0.10,
  FII:          0.10,
  ETF:          0.10,
  US_STOCK:     0.10,
  CRYPTO:       0.00,
  OTHER:        0.00,
}

// Date helpers (no external lib)
function subMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() - n)
  return r
}
function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
}
function fmtQuarter(d: Date): string {
  return `Q${Math.ceil((d.getMonth() + 1) / 3)}/${d.getFullYear().toString().slice(2)}`
}

interface PeriodCfg {
  label: string
  factor: number
  msPerPeriod: number
  todayLabel: (d: Date) => string
  pastLabel: (today: Date, i: number) => string
  futureLabel: (i: number) => string
}

const PERIOD_CONFIG: Record<Period, PeriodCfg> = {
  monthly: {
    label: "Mensal",
    factor: 1 / 12,
    msPerPeriod: (365.25 / 12) * 24 * 60 * 60 * 1000,
    todayLabel: (d) => fmtMonthYear(d),
    pastLabel:  (d, i) => fmtMonthYear(subMonths(d, i)),
    futureLabel: (i) => `+${i} ${i === 1 ? "mês" : "meses"}`,
  },
  quarterly: {
    label: "Trimestral",
    factor: 3 / 12,
    msPerPeriod: (365.25 / 4) * 24 * 60 * 60 * 1000,
    todayLabel: (d) => fmtQuarter(d),
    pastLabel:  (d, i) => fmtQuarter(subMonths(d, i * 3)),
    futureLabel: (i) => `+${i * 3}M`,
  },
  annual: {
    label: "Anual",
    factor: 1,
    msPerPeriod: 365.25 * 24 * 60 * 60 * 1000,
    todayLabel: (d) => String(d.getFullYear()),
    pastLabel:  (d, i) => String(d.getFullYear() - i),
    futureLabel: (i) => `+${i}A`,
  },
}

interface ChartPoint {
  label: string
  hist?: number
  proj?: number
}

function buildChartData(
  totalCost: number,
  totalBalance: number,
  firstTxDate: string | undefined,
  period: Period,
  assetType: string,
): { points: ChartPoint[]; todayLabel: string } {
  const cfg = PERIOD_CONFIG[period]
  const rate = ANNUAL_RATES[assetType] ?? 0
  const periodRate = rate * cfg.factor
  const today = new Date()
  const points: ChartPoint[] = []

  // Historical points (past)
  if (firstTxDate) {
    const start = new Date(firstTxDate)
    const diffMs = today.getTime() - start.getTime()
    const nPeriods = Math.min(Math.floor(diffMs / cfg.msPerPeriod), 12)

    for (let i = nPeriods; i >= 1; i--) {
      const ratio = nPeriods > 0 ? (1 - i / nPeriods) : 0
      const value = Number((totalCost + (totalBalance - totalCost) * ratio).toFixed(2))
      points.push({ label: cfg.pastLabel(today, i), hist: value })
    }
  }

  // Today (junction point — both hist and proj)
  const todayLabel = cfg.todayLabel(today)
  points.push({ label: todayLabel, hist: totalBalance, proj: totalBalance })

  // Future projection (3 periods)
  for (let i = 1; i <= 3; i++) {
    points.push({
      label: cfg.futureLabel(i),
      proj: Number((totalBalance * Math.pow(1 + periodRate, i)).toFixed(2)),
    })
  }

  return { points, todayLabel }
}

const VALUE_BASED = ["FIXED_INCOME", "OTHER"]

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

export function SwimlaneSection({ assetType, label, icon, accentColor, positions, totalValue, firstTxDate }: Props) {
  const [period, setPeriod] = useState<Period>("monthly")
  const [collapsed, setCollapsed] = useState(false)

  const totalCost    = positions.reduce((s, p) => s + p.totalCost,    0)
  const totalBalance = positions.reduce((s, p) => s + p.currentValue, 0)
  const totalGain    = totalBalance - totalCost
  const gainPct      = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const isValueBased = VALUE_BASED.includes(assetType)
  const isMarket = !isValueBased

  const { points: chartData, todayLabel } = useMemo(
    () => buildChartData(totalCost, totalBalance, firstTxDate, period, assetType),
    [period, assetType, totalBalance, totalCost, firstTxDate],
  )

  const showChart = totalBalance > 0 && (ANNUAL_RATES[assetType] ?? 0) > 0

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <span className="font-semibold text-sm">{label}</span>
            <span className="ml-2 text-xs text-muted-foreground">({positions.length} ativo{positions.length !== 1 ? "s" : ""})</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="hidden sm:block text-right">
            <p className="text-muted-foreground">Investido</p>
            <p className="tabular-nums font-medium">{formatCurrency(totalCost)}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-muted-foreground">Saldo</p>
            <p className="tabular-nums font-medium">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Resultado</p>
            <p className={`tabular-nums font-semibold ${variationColor(totalGain)}`}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
              <span className="ml-1 font-normal">({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)</span>
            </p>
          </div>
          <div className="text-muted-foreground shrink-0">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Chart: histórico + Hoje + projeção */}
          {showChart && (
            <div className="px-4 pb-4 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Histórico e projeção estimada</p>
                <div className="flex gap-1">
                  {(["monthly", "quarterly", "annual"] as Period[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {PERIOD_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-hist-${assetType}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={`grad-proj-${assetType}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Valor estimado"]}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    x={todayLabel}
                    stroke="#6b7280"
                    strokeDasharray="4 2"
                    strokeOpacity={0.8}
                    label={{ value: "Hoje", position: "insideTopRight", fontSize: 9, fill: "#6b7280" }}
                  />
                  {/* Historical area (solid) */}
                  <Area
                    type="monotone"
                    dataKey="hist"
                    stroke={accentColor}
                    strokeWidth={2}
                    fill={`url(#grad-hist-${assetType})`}
                    dot={false}
                    activeDot={{ r: 3, fill: accentColor }}
                    connectNulls={false}
                  />
                  {/* Projection area (dashed, lighter) */}
                  <Area
                    type="monotone"
                    dataKey="proj"
                    stroke={accentColor}
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    strokeOpacity={0.6}
                    fill={`url(#grad-proj-${assetType})`}
                    dot={false}
                    activeDot={{ r: 3, fill: accentColor }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-1">
                Taxa projetada: {((ANNUAL_RATES[assetType] ?? 0) * 100).toFixed(0)}% a.a. — apenas referência, não é garantia de rendimento.
              </p>
            </div>
          )}

          {/* Positions table */}
          <div className="border-t border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs">Ativo</th>
                  {isMarket && <th className="text-right p-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Qtd.</th>}
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">
                    {isValueBased ? "Custo" : "P. Médio"}
                  </th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">
                    {isValueBased ? "Saldo" : "Cotação"}
                  </th>
                  {isMarket && (
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Hoje</th>
                  )}
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Valor</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Resultado</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">%</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs">Peso</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => {
                  const href = p.assetType === "FII" ? `/fiis/${p.ticker}` : p.assetType === "ETF" ? `/etfs/${p.ticker}` : `/acoes/${p.ticker}`
                  return (
                    <tr key={`${p.ticker}-${p.assetType}`} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {p.logoUrl ? (
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0">
                              <Image src={p.logoUrl} alt={p.ticker} width={28} height={28} className="object-cover" />
                            </div>
                          ) : (
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${assetBadgeColor[p.assetType] ?? "bg-muted text-muted-foreground"}`}>
                              {assetBadgeLabel[p.assetType] ?? p.assetType}
                            </span>
                          )}
                          <div className="min-w-0">
                            {isMarket ? (
                              <Link href={href} className="font-semibold text-xs hover:text-primary transition-colors">
                                {p.ticker}
                              </Link>
                            ) : (
                              <p className="font-medium text-xs leading-tight max-w-[180px]">{p.ticker}</p>
                            )}
                            {isMarket && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{p.name}</p>}
                          </div>
                        </div>
                      </td>
                      {isMarket && (
                        <td className="p-3 text-right tabular-nums text-xs hidden md:table-cell">
                          {p.quantity % 1 === 0 ? p.quantity.toFixed(0) : p.quantity.toFixed(4)}
                        </td>
                      )}
                      <td className="p-3 text-right tabular-nums text-xs">
                        {formatCurrency(isValueBased ? p.totalCost : p.averagePrice)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-xs font-medium">
                        {formatCurrency(isValueBased ? p.currentValue : p.currentPrice)}
                      </td>
                      {isMarket && (
                        <td className="p-3 text-right hidden sm:table-cell">
                          <VariationBadge value={p.changePercent} size="sm" />
                        </td>
                      )}
                      <td className="p-3 text-right tabular-nums text-xs hidden md:table-cell">
                        {formatCurrency(p.currentValue)}
                      </td>
                      <td className={`p-3 text-right tabular-nums text-xs hidden lg:table-cell ${variationColor(p.gain)}`}>
                        {p.gain !== 0 ? `${p.gain >= 0 ? "+" : ""}${formatCurrency(p.gain)}` : "—"}
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell">
                        {p.gainPercent !== 0 ? <VariationBadge value={p.gainPercent} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-right tabular-nums text-xs text-muted-foreground">
                        {totalValue > 0 ? ((p.currentValue / totalValue) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border">
                  <td colSpan={isMarket ? 2 : 1} className="p-3 text-xs font-semibold">Total</td>
                  <td className="p-3 text-right tabular-nums text-xs font-semibold">{formatCurrency(totalCost)}</td>
                  <td className="p-3 text-right tabular-nums text-xs font-semibold">{formatCurrency(totalBalance)}</td>
                  {isMarket && <td className="hidden sm:table-cell" />}
                  <td className="p-3 text-right tabular-nums text-xs font-semibold hidden md:table-cell">{formatCurrency(totalBalance)}</td>
                  <td className={`p-3 text-right tabular-nums text-xs font-semibold hidden lg:table-cell ${variationColor(totalGain)}`}>
                    {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
                  </td>
                  <td className="hidden lg:table-cell">
                    <div className="flex justify-end p-3">
                      <VariationBadge value={gainPct} size="sm" />
                    </div>
                  </td>
                  <td className="p-3 text-right tabular-nums text-xs font-semibold text-muted-foreground">
                    {totalValue > 0 ? ((totalBalance / totalValue) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
