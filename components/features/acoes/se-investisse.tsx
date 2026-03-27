"use client"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  AreaChart,
  Area,
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
  history: HistoryPoint[]  // full history available (e.g. 5y)
  ticker: string
  selicAnnual: number
}

export function SeInvestisse({ history, ticker, selicAnnual }: Props) {
  const [capital, setCapital] = useState("10000")
  const capNum = parseFloat(capital) || 10000

  const data = useMemo(() => {
    if (!history.length) return []
    const base = history[0].close
    const dailySelic = Math.pow(1 + selicAnnual, 1 / 252) - 1
    return history.map((p, i) => {
      const stockValue = (p.close / base) * capNum
      const cdiValue = capNum * Math.pow(1 + dailySelic, i)
      return {
        date: new Date(p.date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        [ticker]: parseFloat(stockValue.toFixed(2)),
        CDI: parseFloat(cdiValue.toFixed(2)),
      }
    })
  }, [history, capNum, selicAnnual, ticker])

  const last = data[data.length - 1]
  const stockFinal = last ? (last[ticker] as number) : capNum
  const cdiFinal = last ? last.CDI : capNum
  const stockReturn = ((stockFinal - capNum) / capNum) * 100
  const cdiReturn = ((cdiFinal - capNum) / capNum) * 100
  const beatCdi = stockFinal > cdiFinal

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="si-capital">Se você tivesse investido (R$)</Label>
        <Input
          id="si-capital"
          type="number"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          className="mt-1 max-w-xs"
          min="0"
        />
      </div>

      {capNum > 0 && data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className={beatCdi ? "border-emerald-500/40" : "border-muted"}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{ticker} hoje valeria</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${beatCdi ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(stockFinal)}
                </p>
                <div className={`flex items-center gap-1 mt-1 ${beatCdi ? "text-emerald-500" : "text-red-500"}`}>
                  {beatCdi ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-xs font-medium">
                    {stockReturn >= 0 ? "+" : ""}{stockReturn.toFixed(1)}% no período
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">CDI/SELIC renderia</p>
                <p className="text-2xl font-bold tabular-nums mt-1 text-emerald-500">
                  {formatCurrency(cdiFinal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">+{cdiReturn.toFixed(1)}% no período</p>
              </CardContent>
            </Card>
          </div>

          <Card className={`p-3 text-sm font-medium text-center ${beatCdi ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
            {beatCdi
              ? `${ticker} superou o CDI em ${(stockFinal - cdiFinal) > 0 ? "+" : ""}${formatCurrency(stockFinal - cdiFinal)} (${(stockReturn - cdiReturn).toFixed(1)}pp)`
              : `${ticker} ficou ${formatCurrency(cdiFinal - stockFinal)} abaixo do CDI (${(stockReturn - cdiReturn).toFixed(1)}pp)`}
          </Card>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cdiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v))]}
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Area type="monotone" dataKey={ticker} stroke="#3b82f6" fill="url(#stockGrad)" dot={false} strokeWidth={2} />
              <Area type="monotone" dataKey="CDI" stroke="#10b981" fill="url(#cdiGrad)" dot={false} strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
