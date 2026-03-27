import { fetchMultipleQuotes } from "@/lib/brapi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = { title: "Ações" }
export const revalidate = 300

const TICKERS = [
  "PETR4","VALE3","ITUB4","BBDC4","WEGE3","RENT3","ABEV3","B3SA3",
  "MGLU3","LREN3","JBSS3","EGIE3","PRIO3","HAPV3","TAEE11","CPLE6",
  "VIVT3","SBSP3","CCRO3","ELET3"
]

export default async function AcoesPage() {
  const quotes = await fetchMultipleQuotes(TICKERS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ações</h1>
          <p className="text-muted-foreground">Bolsa de valores brasileira (B3)</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ticker..." className="pl-9" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Ativo</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Preço</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Variação D</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Máx 52s</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Mín 52s</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">Volume</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">P/L</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">D.Y.</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sem dados disponíveis</td></tr>
              ) : quotes.map((q) => (
                <tr key={q.symbol} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/acoes/${q.symbol}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                      {q.logourl && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                          <Image src={q.logourl} alt={q.symbol} width={32} height={32} className="object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{q.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{q.shortName}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium">
                    {formatCurrency(q.regularMarketPrice)}
                  </td>
                  <td className="p-4 text-right">
                    <VariationBadge value={q.regularMarketChangePercent} size="sm" />
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                    {q.fiftyTwoWeekHigh ? formatCurrency(q.fiftyTwoWeekHigh) : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                    {q.fiftyTwoWeekLow ? formatCurrency(q.fiftyTwoWeekLow) : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                    {q.regularMarketVolume ? formatCompact(q.regularMarketVolume) : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums hidden lg:table-cell">
                    {q.priceEarnings ? q.priceEarnings.toFixed(1) : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums hidden lg:table-cell">
                    {q.dividendsYield ? `${(q.dividendsYield * 100).toFixed(2)}%` : "—"}
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
