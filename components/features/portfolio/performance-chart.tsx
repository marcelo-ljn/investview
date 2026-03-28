"use client"
import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Snapshot {
  date: string | Date
  totalValue: number
  totalCost: number
}

interface PerformanceChartProps {
  snapshots: Snapshot[]
}

export function PerformanceChart({ snapshots }: PerformanceChartProps) {
  const data = useMemo(() => {
    if (snapshots.length === 0) return []
    return snapshots.map(s => ({
      date: new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      patrimonio: Number(s.totalValue.toFixed(2)),
      custo: Number(s.totalCost.toFixed(2)),
    }))
  }, [snapshots])

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Histórico de evolução será exibido após o segundo acesso à carteira.
      </div>
    )
  }

  const firstValue = data[0].custo
  const lastValue = data[data.length - 1].patrimonio
  const gain = lastValue - firstValue
  const gainPct = firstValue > 0 ? (gain / firstValue) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Patrimônio atual</p>
          <p className="font-semibold">{formatCurrency(lastValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Resultado total</p>
          <p className={`font-semibold ${gain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {gain >= 0 ? "+" : ""}{formatCurrency(gain)} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%)
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            formatter={(v) => [formatCurrency(Number(v)), ""]}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: 12,
            }}
          />
          <ReferenceLine y={firstValue} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="custo"
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 2"
            strokeWidth={1.5}
            dot={false}
            name="Custo"
          />
          <Line
            type="monotone"
            dataKey="patrimonio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Patrimônio"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-blue-500 inline-block" />
          Patrimônio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t border-dashed border-muted-foreground inline-block" />
          Custo
        </span>
      </div>
    </div>
  )
}
