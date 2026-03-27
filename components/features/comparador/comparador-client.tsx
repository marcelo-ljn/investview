"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import type { BrapiQuote } from "@/lib/brapi"

interface ComparadorClientProps {
  initialTickers: string[]
  quotes: BrapiQuote[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function ComparadorClient({ initialTickers, quotes }: ComparadorClientProps) {
  const router = useRouter()
  const [tickers, setTickers] = useState<string[]>(initialTickers)
  const [input, setInput] = useState("")

  function add() {
    const t = input.trim().toUpperCase()
    if (t && !tickers.includes(t) && tickers.length < 5) {
      const newTickers = [...tickers, t]
      setTickers(newTickers)
      setInput("")
      router.push(`/comparador?tickers=${newTickers.join(",")}`)
    }
  }

  function remove(t: string) {
    const newTickers = tickers.filter(x => x !== t)
    setTickers(newTickers)
    router.push(`/comparador?tickers=${newTickers.join(",")}`)
  }

  const metrics = [
    { label: "Preço", getValue: (q: BrapiQuote) => formatCurrency(q.regularMarketPrice) },
    { label: "Variação D", getValue: (q: BrapiQuote) => null, getVariation: (q: BrapiQuote) => q.regularMarketChangePercent },
    { label: "P/L", getValue: (q: BrapiQuote) => q.priceEarnings?.toFixed(1) ?? "—" },
    { label: "P/VP", getValue: (q: BrapiQuote) => q.priceToBook?.toFixed(2) ?? "—" },
    { label: "D.Y.", getValue: (q: BrapiQuote) => q.dividendsYield ? `${(q.dividendsYield * 100).toFixed(2)}%` : "—" },
    { label: "Market Cap", getValue: (q: BrapiQuote) => q.marketCap ? `R$ ${formatCompact(q.marketCap)}` : "—" },
    { label: "Máx 52s", getValue: (q: BrapiQuote) => q.fiftyTwoWeekHigh ? formatCurrency(q.fiftyTwoWeekHigh) : "—" },
    { label: "Mín 52s", getValue: (q: BrapiQuote) => q.fiftyTwoWeekLow ? formatCurrency(q.fiftyTwoWeekLow) : "—" },
  ]

  return (
    <div className="space-y-6">
      {/* Ticker selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap items-center">
            {tickers.map((t, i) => (
              <div key={t} className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium" style={{ background: COLORS[i] + "20", color: COLORS[i] }}>
                {t}
                <button onClick={() => remove(t)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {tickers.length < 5 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: HGLG11"
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && add()}
                  className="w-full sm:w-28 min-w-[80px] h-8 text-xs"
                />
                <Button size="sm" onClick={add} className="h-8 gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo de métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-card z-10">Métrica</th>
                    {quotes.map((q, i) => (
                      <th key={q.symbol} className="text-right p-3 font-medium" style={{ color: COLORS[i] }}>
                        {q.symbol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(m => (
                    <tr key={m.label} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground sticky left-0 bg-card z-10">{m.label}</td>
                      {quotes.map(q => (
                        <td key={q.symbol} className="p-3 text-right tabular-nums">
                          {m.getVariation ? (
                            <VariationBadge value={m.getVariation(q)} size="sm" />
                          ) : (
                            m.getValue(q)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-border">
                    <td className="p-3 text-muted-foreground sticky left-0 bg-card z-10">Nome</td>
                    {quotes.map(q => (
                      <td key={q.symbol} className="p-3 text-right text-xs text-muted-foreground">{q.shortName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground sticky left-0 bg-card z-10">Setor</td>
                    {quotes.map(q => (
                      <td key={q.symbol} className="p-3 text-right text-xs text-muted-foreground">{q.sector ?? "—"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
