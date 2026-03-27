"use client"
import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface HistoryPoint {
  date: string
  close: number
}

interface Props {
  stockHistory: HistoryPoint[]
  ibovHistory: HistoryPoint[]
  selicAnnual: number // e.g. 0.1075 for 10.75%
  ticker: string
}

export function BenchmarkChart({ stockHistory, ibovHistory, selicAnnual, ticker }: Props) {
  const data = useMemo(() => {
    if (!stockHistory.length) return []
    const n = Math.min(stockHistory.length, ibovHistory.length || stockHistory.length)
    const stockBase = stockHistory[0].close
    const ibovBase = ibovHistory[0]?.close ?? 1
    const dailySelic = Math.pow(1 + selicAnnual, 1 / 252) - 1

    return Array.from({ length: n }, (_, i) => {
      const sp = stockHistory[i]
      const ip = ibovHistory[i]
      return {
        date: new Date(sp.date).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        [ticker]: parseFloat(((sp.close / stockBase) * 100).toFixed(2)),
        IBOV: ip ? parseFloat(((ip.close / ibovBase) * 100).toFixed(2)) : undefined,
        CDI: parseFloat((100 * Math.pow(1 + dailySelic, i)).toFixed(2)),
      }
    })
  }, [stockHistory, ibovHistory, selicAnnual, ticker])

  if (!data.length)
    return <p className="py-8 text-center text-muted-foreground">Sem dados históricos</p>

  const last = data[data.length - 1]
  const stockRet = (last[ticker] as number) - 100
  const ibovRet = last.IBOV != null ? (last.IBOV as number) - 100 : null
  const cdiRet = last.CDI - 100

  const summary = [
    { label: ticker, value: stockRet, color: "#3b82f6" },
    { label: "IBOV", value: ibovRet, color: "#f59e0b" },
    { label: "CDI (SELIC)", value: cdiRet, color: "#10b981" },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <div key={s.label} className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            {s.value != null ? (
              <p
                className={`text-lg font-bold tabular-nums ${
                  s.value >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {s.value >= 0 ? "+" : ""}
                {s.value.toFixed(1)}%
              </p>
            ) : (
              <p className="text-lg font-bold text-muted-foreground">—</p>
            )}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(1)}`]}
            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          />
          <Legend />
          <Line type="monotone" dataKey={ticker} stroke="#3b82f6" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="IBOV" stroke="#f59e0b" dot={false} strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="CDI"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-muted-foreground">
        Base 100 no início do período. CDI estimado pela SELIC anualizada.
      </p>
    </div>
  )
}
