"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface Props {
  price: number
  eps?: number
  priceToBook?: number
  dividendsYield?: number
}

function PriceTag({ label, fairPrice, price }: { label: string; fairPrice: number | null; price: number }) {
  if (!fairPrice || fairPrice <= 0)
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-muted-foreground mt-1">—</p>
          <p className="text-xs text-muted-foreground mt-1">Dados insuficientes</p>
        </CardContent>
      </Card>
    )

  const diff = ((price - fairPrice) / fairPrice) * 100
  const isAbove = diff > 5
  const isBelow = diff < -5
  const color = isBelow ? "text-emerald-500" : isAbove ? "text-red-500" : "text-amber-500"
  const Icon = isBelow ? TrendingDown : isAbove ? TrendingUp : Minus
  const borderClass = isBelow ? "border-emerald-500/30" : isAbove ? "border-red-500/30" : "border-amber-500/30"

  return (
    <Card className={`border ${borderClass}`}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(fairPrice)}</p>
        <div className={`flex items-center gap-1 mt-1 ${color}`}>
          <Icon className="h-3 w-3" />
          <span className="text-xs font-medium">
            {isBelow
              ? `${Math.abs(diff).toFixed(1)}% de desconto`
              : isAbove
              ? `${diff.toFixed(1)}% acima do justo`
              : "Próximo ao preço justo"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function PrecoJusto({ price, eps, priceToBook, dividendsYield }: Props) {
  const [capital, setCapital] = useState("10000")
  const capNum = parseFloat(capital) || 0

  // Graham: √(22.5 × LPA × VPA)
  const vpa = priceToBook && priceToBook > 0 ? price / priceToBook : null
  const grahamPrice =
    eps && vpa && eps > 0 && vpa > 0 ? Math.sqrt(22.5 * eps * vpa) : null

  // Bazin: DPA ÷ 0.06
  const dpa = dividendsYield ? price * dividendsYield : null
  const bazinPrice = dpa ? dpa / 0.06 : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PriceTag label="Graham  (√22,5 × LPA × VPA)" fairPrice={grahamPrice} price={price} />
        <PriceTag label="Bazin  (DPA ÷ 6%)" fairPrice={bazinPrice} price={price} />
      </div>

      {dividendsYield && dividendsYield > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projeção de dividendos por capital investido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="capital-input">Capital a investir (R$)</Label>
              <Input
                id="capital-input"
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="mt-1 max-w-xs"
                min="0"
              />
            </div>
            {capNum > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[12, 24, 60].map((months) => {
                  const annual = capNum * dividendsYield
                  const total = annual * (months / 12)
                  return (
                    <div key={months} className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{months} meses</p>
                      <p className="text-base font-bold text-emerald-500 tabular-nums mt-1">
                        {formatCurrency(total)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(total / months)}/mês</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg leading-relaxed">
        <strong>Graham:</strong> √(22,5 × LPA × VPA) — para empresas estáveis e lucrativas. &nbsp;
        <strong>Bazin:</strong> DPA ÷ 6% — focado em pagadores de dividendos. Não constitui recomendação de investimento.
      </p>
    </div>
  )
}
