import { fetchMultipleQuotes, fetchDividends } from "@/lib/brapi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Agenda de Dividendos" }
export const revalidate = 3600

const MONITORED = [
  "PETR4","VALE3","ITUB4","BBDC4","WEGE3","EGIE3","TAEE11","CPLE6","VIVT3","SBSP3",
  "HGLG11","XPML11","KNRI11","MXRF11","CPTS11","KNCR11","IRDM11","BTLG11","HGBS11","VISC11",
]

type MonthMap = Record<string, { ticker: string; value: number; paymentDate: string }[]>

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

export default async function DividendosPage() {
  const dividendResults = await Promise.allSettled(
    MONITORED.map(async (ticker) => {
      const divs = await fetchDividends(ticker)
      return { ticker, divs: divs.slice(-6) } // last 6 distributions
    })
  )

  // Build month map (last 12 months)
  const monthMap: MonthMap = {}
  const now = new Date()

  dividendResults.forEach((result) => {
    if (result.status !== "fulfilled") return
    const { ticker, divs } = result.value
    divs.forEach((d) => {
      const date = d.paymentDate ?? d.earningsDate
      if (!date || !d.value) return
      // Parse date (dd/mm/yyyy or yyyy-mm-dd)
      let parsed: Date
      if (date.includes("/")) {
        const [day, month, year] = date.split("/")
        parsed = new Date(`${year}-${month}-${day}`)
      } else {
        parsed = new Date(date)
      }
      if (isNaN(parsed.getTime())) return
      const diff = (now.getFullYear() - parsed.getFullYear()) * 12 + (now.getMonth() - parsed.getMonth())
      if (diff < 0 || diff > 11) return // only last 12 months

      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`
      if (!monthMap[key]) monthMap[key] = []
      monthMap[key].push({ ticker, value: d.value, paymentDate: date })
    })
  })

  const sortedMonths = Object.keys(monthMap).sort().reverse()

  // Upcoming: next 3 months (no data yet, just show monitored list)
  const upcoming = MONTHS_PT[(now.getMonth() + 1) % 12]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Agenda de Dividendos</h1>
        <p className="text-muted-foreground">Histórico de pagamentos dos principais ativos monitorados</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ativos monitorados</p>
            <p className="text-2xl font-bold mt-1">{MONITORED.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Meses com pagamentos</p>
            <p className="text-2xl font-bold mt-1">{sortedMonths.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de eventos</p>
            <p className="text-2xl font-bold mt-1">
              {Object.values(monthMap).reduce((acc, v) => acc + v.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Próximo mês</p>
            <p className="text-2xl font-bold mt-1">{upcoming}</p>
          </CardContent>
        </Card>
      </div>

      {/* Month-by-month */}
      {sortedMonths.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum pagamento encontrado nos últimos 12 meses.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMonths.map((monthKey) => {
            const [year, month] = monthKey.split("-")
            const label = `${MONTHS_PT[parseInt(month) - 1]} ${year}`
            const events = monthMap[monthKey].sort((a, b) => a.ticker.localeCompare(b.ticker))

            return (
              <Card key={monthKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {events.map((ev, i) => (
                      <div key={`${ev.ticker}-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-xs font-semibold">{ev.ticker}</p>
                          <p className="text-xs text-muted-foreground">{ev.paymentDate}</p>
                        </div>
                        <p className="text-xs font-bold text-emerald-500 tabular-nums">
                          {formatCurrency(ev.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
