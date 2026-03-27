"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function ComparadorPage() {
  const [tickers, setTickers] = useState<string[]>(["PETR4", "VALE3"])
  const [input, setInput] = useState("")

  function add() {
    const t = input.trim().toUpperCase()
    if (t && !tickers.includes(t) && tickers.length < 5) {
      setTickers([...tickers, t])
      setInput("")
    }
  }

  function remove(t: string) {
    setTickers(tickers.filter((x) => x !== t))
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comparador de Ativos</h1>
        <p className="text-muted-foreground">Compare até 5 ativos lado a lado (ações, FIIs, ETFs)</p>
      </div>

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
                  placeholder="Ex: ITUB4"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  className="w-28 h-8 text-xs"
                />
                <Button size="sm" onClick={add} className="h-8 gap-1">
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance relativa (base 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p className="text-sm">Adicione ativos acima para ver o gráfico comparativo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
