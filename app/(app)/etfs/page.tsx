import { fetchMultipleQuotes } from "@/lib/brapi"
import { Card } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "ETFs" }
export const revalidate = 300

const ETF_TICKERS = [
  "BOVA11","SMAL11","IVVB11","SPXI11","HASH11","GOLD11","DIVO11","FIND11",
  "MATB11","ACWI11","XINA11","TECK11","NASD11"
]

export default async function ETFsPage() {
  const quotes = await fetchMultipleQuotes(ETF_TICKERS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ETFs</h1>
        <p className="text-muted-foreground">Exchange Traded Funds brasileiros e internacionais</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">ETF</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Preço</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Variação D</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Máx 52s</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">Mín 52s</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden lg:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem dados disponíveis</td></tr>
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
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{q.shortName}</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
