"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { Wallet } from "lucide-react"

interface Props {
  price: number
  dividendsYield?: number // annual DY (decimal)
  lastDividend?: number   // last monthly dividend per share
}

export function RendaPassiva({ price, dividendsYield, lastDividend }: Props) {
  const [capital, setCapital] = useState("50000")
  const [meta, setMeta] = useState("3000")
  const capNum = parseFloat(capital) || 0
  const metaNum = parseFloat(meta) || 0

  // Monthly yield per share
  const monthlyYieldPerShare = lastDividend ?? (dividendsYield ? (price * dividendsYield) / 12 : null)
  const monthlyYieldPct = monthlyYieldPerShare && price > 0 ? (monthlyYieldPerShare / price) * 100 : null

  // Results
  const sharesFromCapital = price > 0 ? Math.floor(capNum / price) : 0
  const monthlyFromCapital = monthlyYieldPerShare ? sharesFromCapital * monthlyYieldPerShare : null

  const sharesForMeta = monthlyYieldPerShare && monthlyYieldPerShare > 0
    ? Math.ceil(metaNum / monthlyYieldPerShare)
    : null
  const capitalForMeta = sharesForMeta ? sharesForMeta * price : null

  if (!monthlyYieldPerShare && !dividendsYield) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Dados de rendimento não disponíveis para este FII.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {monthlyYieldPct != null && (
        <Card className="border-emerald-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <Wallet className="h-8 w-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Rendimento mensal estimado por cota</p>
              <p className="text-2xl font-bold text-emerald-500 tabular-nums">
                {monthlyYieldPerShare ? formatCurrency(monthlyYieldPerShare) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{monthlyYieldPct.toFixed(3)}% ao mês</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simulação por capital */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quanto rende meu capital?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="cap-input">Capital disponível (R$)</Label>
              <Input
                id="cap-input"
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="mt-1"
                min="0"
              />
            </div>
            {capNum > 0 && monthlyFromCapital != null && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cotas compradas</span>
                  <span className="font-medium tabular-nums">{sharesFromCapital.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renda mensal</span>
                  <span className="font-bold text-emerald-500 tabular-nums">{formatCurrency(monthlyFromCapital)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renda anual</span>
                  <span className="font-medium tabular-nums">{formatCurrency(monthlyFromCapital * 12)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulação por meta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quanto preciso investir?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="meta-input">Meta de renda mensal (R$)</Label>
              <Input
                id="meta-input"
                type="number"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className="mt-1"
                min="0"
              />
            </div>
            {metaNum > 0 && capitalForMeta != null && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cotas necessárias</span>
                  <span className="font-medium tabular-nums">{sharesForMeta?.toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capital necessário</span>
                  <span className="font-bold text-primary tabular-nums">{formatCurrency(capitalForMeta)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
        Simulação baseada no último rendimento distribuído. Rendimentos passados não garantem resultados futuros. Não constitui recomendação de investimento.
      </p>
    </div>
  )
}
