import { fetchQuote, fetchHistory, fetchDividends } from "@/lib/brapi"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import { StockChart } from "@/components/features/acoes/stock-chart"
import { DividendChart } from "@/components/features/acoes/dividend-chart"
import { RendaPassiva } from "@/components/features/fiis/renda-passiva"
import { BenchmarkChart } from "@/components/features/acoes/benchmark-chart"
import { fetchSELIC } from "@/lib/bcb"
import Image from "next/image"
import type { Metadata } from "next"

export const revalidate = 300

interface Props { params: Promise<{ ticker: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  return { title: ticker.toUpperCase() }
}

export default async function FIIDetailPage({ params }: Props) {
  const { ticker } = await params
  const upper = ticker.toUpperCase()

  const [quote, history, dividends, ifixHistory, selic] = await Promise.all([
    fetchQuote(upper),
    fetchHistory(upper, "1y", "1d"),
    fetchDividends(upper),
    fetchHistory("IFIX11", "1y", "1d").catch(() => null),
    fetchSELIC().catch(() => null),
  ])

  if (!quote) notFound()

  const selicAnnual = selic ? selic.value / 100 : 0.1075
  const lastDividend = dividends?.[dividends.length - 1]?.value ?? undefined

  const metrics = [
    { label: "P/VP", value: quote.priceToBook?.toFixed(2) ?? "—" },
    { label: "DY (12M)", value: quote.dividendsYield ? `${(quote.dividendsYield * 100).toFixed(2)}%` : "—" },
    { label: "Último rend.", value: lastDividend ? formatCurrency(lastDividend) : "—" },
    { label: "Market Cap", value: quote.marketCap ? formatCompact(quote.marketCap) : "—" },
    { label: "Volume", value: formatCompact(quote.regularMarketVolume) },
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
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(quote.regularMarketPrice)}</p>
          <p className={`text-sm tabular-nums ${quote.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {quote.regularMarketChange >= 0 ? "+" : ""}{formatCurrency(quote.regularMarketChange)}
          </p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-base font-bold tabular-nums mt-0.5">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="chart">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="rendimentos">Rendimentos</TabsTrigger>
          <TabsTrigger value="renda-passiva">Renda Passiva</TabsTrigger>
          <TabsTrigger value="comparativo">vs IFIX / CDI</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <StockChart history={history} ticker={upper} />
        </TabsContent>

        <TabsContent value="rendimentos" className="mt-4">
          <DividendChart dividends={dividends} ticker={upper} />
        </TabsContent>

        <TabsContent value="renda-passiva" className="mt-4">
          <RendaPassiva
            price={quote.regularMarketPrice}
            dividendsYield={quote.dividendsYield}
            lastDividend={lastDividend}
          />
        </TabsContent>

        <TabsContent value="comparativo" className="mt-4">
          <BenchmarkChart
            stockHistory={history ?? []}
            ibovHistory={ifixHistory ?? []}
            selicAnnual={selicAnnual}
            ticker={upper}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
