"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { formatCurrency, formatCompact } from "@/lib/utils"
import type { BrapiHistoricalPoint } from "@/lib/brapi"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

type Period = "1M" | "3M" | "6M" | "1Y"

const periods: Period[] = ["1M", "3M", "6M", "1Y"]
const periodDays: Record<Period, number> = { "1M": 22, "3M": 66, "6M": 132, "1Y": 252 }

interface StockChartProps {
  history: BrapiHistoricalPoint[]
  ticker: string
}

export function StockChart({ history, ticker }: StockChartProps) {
  const [period, setPeriod] = useState<Period>("3M")

  const sliced = history.slice(-periodDays[period])
  const chartData = sliced.map((p) => ({
    date: p.date,
    close: p.close,
    volume: p.volume,
  }))

  const first = chartData[0]?.close ?? 0
  const last = chartData[chartData.length - 1]?.close ?? 0
  const isPositive = last >= first

  return (
    <Card>
      <CardContent className="p-4">
        {/* Period selector */}
        <div className="flex gap-1 mb-4">
          {periods.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="h-7 px-3 text-xs"
            >
              {p}
            </Button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => { try { return format(parseISO(v), "dd/MM", { locale: ptBR }) } catch { return v } }}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={(v) => `R$${v.toFixed(0)}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value, name) =>
                name === "close" ? [formatCurrency(Number(value)), "Preço"] : [formatCompact(Number(value)), "Volume"]
              }
              labelFormatter={(v) => { try { return format(parseISO(v), "dd/MM/yyyy", { locale: ptBR }) } catch { return v } }}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 }}
            />
            <Bar yAxisId="volume" dataKey="volume" fill={isPositive ? "#10b98130" : "#ef444430"} />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
