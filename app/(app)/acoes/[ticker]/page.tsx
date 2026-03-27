import { fetchQuote, fetchHistory, fetchDividends } from "@/lib/brapi"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact, formatPercent } from "@/lib/utils"
import { StockChart } from "@/components/features/acoes/stock-chart"
import { DividendChart } from "@/components/features/acoes/dividend-chart"
import Image from "next/image"
import type { Metadata } from "next"

export const revalidate = 300

interface Props { params: Promise<{ ticker: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  return { title: ticker.toUpperCase() }
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params
  const upper = ticker.toUpperCase()

  const [quote, history, dividends] = await Promise.all([
    fetchQuote(upper),
    fetchHistory(upper, "1y", "1d"),
    fetchDividends(upper),
  ])

  if (!quote) notFound()

  const fundamentals = [
    { label: "P/L", value: quote.priceEarnings?.toFixed(1) ?? "—" },
    { label: "P/VP", value: quote.priceToBook?.toFixed(2) ?? "—" },
    { label: "D.Y.", value: quote.dividendsYield ? `${(quote.dividendsYield * 100).toFixed(2)}%` : "—" },
    { label: "LPA", value: quote.earningsPerShare ? formatCurrency(quote.earningsPerShare) : "—" },
    { label: "Market Cap", value: quote.marketCap ? formatCompact(quote.marketCap) : "—" },
    { label: "Volume", value: quote.regularMarketVolume ? formatCompact(quote.regularMarketVolume) : "—" },
    { label: "Máx 52s", value: quote.fiftyTwoWeekHigh ? formatCurrency(quote.fiftyTwoWeekHigh) : "—" },
    { label: "Mín 52s", value: quote.fiftyTwoWeekLow ? formatCurrency(quote.fiftyTwoWeekLow) : "—" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {quote.logourl && (
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
            <Image src={quote.logourl} alt={upper} width={48} height={48} className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold">{upper}</h1>
            <VariationBadge value={quote.regularMarketChangePercent} />
          </div>
          <p className="text-muted-foreground">{quote.longName ?? quote.shortName}</p>
          {quote.sector && <p className="text-xs text-muted-foreground mt-0.5">{quote.sector}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(quote.regularMarketPrice)}</p>
          <p className={`text-sm tabular-nums ${quote.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {quote.regularMarketChange >= 0 ? "+" : ""}{formatCurrency(quote.regularMarketChange)}
          </p>
        </div>
      </div>

      {/* OHLCV bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pb-1">
        {[
          { label: "Abertura", value: formatCurrency(quote.regularMarketOpen) },
          { label: "Máxima", value: formatCurrency(quote.regularMarketDayHigh) },
          { label: "Mínima", value: formatCurrency(quote.regularMarketDayLow) },
          { label: "Fechamento ant.", value: formatCurrency(quote.regularMarketPreviousClose) },
          { label: "Volume", value: formatCompact(quote.regularMarketVolume) },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className="font-medium tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="fundamentals">Fundamentos</TabsTrigger>
          <TabsTrigger value="dividends">Dividendos</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <StockChart history={history} ticker={upper} />
        </TabsContent>

        <TabsContent value="fundamentals" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fundamentals.map((f) => (
              <Card key={f.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-xl font-bold tabular-nums mt-1">{f.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dividends" className="mt-4">
          <DividendChart dividends={dividends} ticker={upper} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
