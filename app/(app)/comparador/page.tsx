import { fetchMultipleQuotes } from "@/lib/brapi"
import { ComparadorClient } from "@/components/features/comparador/comparador-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Comparador de Ativos" }
export const revalidate = 300

interface Props {
  searchParams: Promise<{ tickers?: string }>
}

export default async function ComparadorPage({ searchParams }: Props) {
  const { tickers: tickersParam } = await searchParams
  const tickers = tickersParam
    ? tickersParam.split(",").map(t => t.trim().toUpperCase()).slice(0, 5)
    : ["PETR4", "VALE3", "ITUB4"]

  const quotes = await fetchMultipleQuotes(tickers)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comparador de Ativos</h1>
        <p className="text-muted-foreground">Compare até 5 ativos lado a lado (ações, FIIs, ETFs)</p>
      </div>
      <ComparadorClient initialTickers={tickers} quotes={quotes} />
    </div>
  )
}
