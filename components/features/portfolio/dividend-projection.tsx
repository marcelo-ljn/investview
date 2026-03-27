"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

interface Position {
  ticker: string
  currentValue: number
  dividendsYield?: number | null
}

interface Props {
  positions: Position[]
}

export function DividendProjection({ positions }: Props) {
  const rows = positions
    .filter(p => p.dividendsYield && p.dividendsYield > 0)
    .map(p => ({
      ticker: p.ticker,
      currentValue: p.currentValue,
      annualDY: (p.dividendsYield ?? 0) * 100,
      monthlyIncome: (p.currentValue * (p.dividendsYield ?? 0)) / 12,
    }))
    .sort((a, b) => b.monthlyIncome - a.monthlyIncome)

  const totalMonthly = rows.reduce((s, r) => s + r.monthlyIncome, 0)
  const totalAnnual = totalMonthly * 12

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Projeção de Dividendos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Renda mensal estimada</p>
            <p className="text-2xl font-bold text-emerald-500 tabular-nums mt-1">{formatCurrency(totalMonthly)}</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">Renda anual estimada</p>
            <p className="text-2xl font-bold text-blue-500 tabular-nums mt-1">{formatCurrency(totalAnnual)}</p>
          </div>
        </div>

        {/* Per asset */}
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.ticker} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-16">{r.ticker}</span>
                <span className="text-xs text-muted-foreground">DY {r.annualDY.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-muted-foreground text-xs hidden sm:block">{formatCurrency(r.currentValue)}</span>
                <span className="text-emerald-500 font-medium">{formatCurrency(r.monthlyIncome)}/mês</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          * Projeção baseada no DY dos últimos 12 meses. Não constitui garantia de rendimento futuro.
        </p>
      </CardContent>
    </Card>
  )
}
