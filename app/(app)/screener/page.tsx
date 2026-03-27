import { fetchMultipleQuotes } from "@/lib/brapi"
import { ScreenerClient } from "@/components/features/screener/screener-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Screener de Ações" }
export const revalidate = 300

const ALL_TICKERS = [
  "PETR4","PETR3","VALE3","ITUB4","ITUB3","BBDC4","BBDC3","WEGE3","RENT3","ABEV3",
  "B3SA3","MGLU3","LREN3","JBSS3","EGIE3","PRIO3","HAPV3","TAEE11","CPLE6","VIVT3",
  "SBSP3","CCRO3","ELET3","ELET6","RADL3","RAIL3","EQTL3","ENEV3","CSAN3","BRFS3",
  "UGPA3","YDUQ3","TOTS3","LWSA3","AZUL4","GOLL4","EMBR3","USIM5","CSNA3","GOAU4",
]

export default async function ScreenerPage() {
  const quotes = await fetchMultipleQuotes(ALL_TICKERS)

  return <ScreenerClient quotes={quotes} />
}
