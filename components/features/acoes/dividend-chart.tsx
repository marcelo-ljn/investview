"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { BrapiDividend } from "@/lib/brapi"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DividendChartProps {
  dividends: BrapiDividend[]
  ticker: string
}

export function DividendChart({ dividends, ticker }: DividendChartProps) {
  if (!dividends || dividends.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum dividendo encontrado para {ticker}
        </CardContent>
      </Card>
    )
  }

  const chartData = dividends
    .filter((d) => d.value && d.earningsDate)
    .slice(-24)
    .map((d) => ({
      date: d.earningsDate ?? "",
      value: d.value ?? 0,
      type: d.type ?? "DIVIDENDO",
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const total12m = chartData.slice(-12).reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Dividendos 12 meses</p>
            <p className="text-xl font-bold tabular-nums text-emerald-500 mt-1">{formatCurrency(total12m)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Quantidade de pagamentos</p>
            <p className="text-xl font-bold tabular-nums mt-1">{chartData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Média por pagamento</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {chartData.length > 0 ? formatCurrency(total12m / Math.min(chartData.slice(-12).length, 1)) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico de Dividendos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => { try { return format(parseISO(v), "MM/yy") } catch { return v } }}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `R$${v.toFixed(2)}`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Dividendo"]}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
