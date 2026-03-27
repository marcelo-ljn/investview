import { fetchMultipleQuotes } from "@/lib/brapi"
import { Card } from "@/components/ui/card"
import { VariationBadge } from "@/components/ui/variation-badge"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "FIIs" }
export const revalidate = 300

const FII_TICKERS = [
  "HGLG11","XPML11","KNRI11","BRCO11","VISC11","HSML11","RECT11","HGBS11",
  "MXRF11","CPTS11","KNCR11","IRDM11","RBRF11","BTLG11","JSRE11","BCFF11",
  "RBRP11","HCTR11","RZTR11","FIIB11"
]

export default async function FIIsPage() {
  const quotes = await fetchMultipleQuotes(FII_TICKERS)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fundos Imobiliários (FIIs)</h1>
        <p className="text-muted-foreground">Fundos de tijolo, papel, híbridos e FOFs</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">FII</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Preço</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Variação D</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">DY (12M)</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden md:table-cell">P/VP</th>
                <th className="text-right p-4 font-medium text-muted-foreground hidden sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem dados disponíveis</td></tr>
              ) : quotes.map((q) => (
                <tr key={q.symbol} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/fiis/${q.symbol}`} className="flex items-center gap-3 hover:text-primary transition-colors">
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
                  <td className="p-4 text-right tabular-nums hidden md:table-cell text-emerald-500">
                    {q.dividendsYield ? `${(q.dividendsYield * 100).toFixed(2)}%` : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums hidden md:table-cell">
                    {q.priceToBook ? q.priceToBook.toFixed(2) : "—"}
                  </td>
                  <td className="p-4 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    {q.regularMarketVolume ? formatCurrency(q.regularMarketVolume) : "—"}
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
