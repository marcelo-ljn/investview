import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import { Bitcoin } from "lucide-react"

export const metadata: Metadata = { title: "Cripto" }
export const revalidate = 300

async function fetchCryptoData() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=20&page=1&sparkline=false",
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function CriptoPage() {
  const cryptos = await fetchCryptoData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Criptomoedas</h1>
        <p className="text-muted-foreground">Top 20 por market cap, cotações em BRL</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Moeda</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Preço (BRL)</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Variação 24h</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Market Cap</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">Volume 24h</th>
              </tr>
            </thead>
            <tbody>
              {cryptos.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando dados...</td></tr>
              ) : cryptos.map((c: { market_cap_rank: number; image: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number; total_volume: number }, i: number) => (
                <tr key={c.symbol} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground">{c.market_cap_rank ?? i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.symbol} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bitcoin className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold uppercase">{c.symbol}</p>
                        <p className="text-xs text-muted-foreground">{c.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium">
                    {formatCurrency(c.current_price)}
                  </td>
                  <td className="p-4 text-right">
                    <VariationBadge value={c.price_change_percentage_24h ?? 0} size="sm" />
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                    R$ {formatCompact(c.market_cap)}
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                    R$ {formatCompact(c.total_volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
