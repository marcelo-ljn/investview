import { fetchAllRates } from "@/lib/bcb"
import { fetchTesouroBonds } from "@/lib/tesouro"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Banknote, TrendingUp, Activity, BarChart } from "lucide-react"
import { RendaFixaSimulador } from "@/components/features/renda-fixa/simulador"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Renda Fixa" }
export const revalidate = 3600

const bondTypeBadge: Record<string, string> = {
  SELIC: "default",
  IPCA: "success",
  PREFIXADO: "warning",
  IPCA_JUROS: "success",
  PREFIXADO_JUROS: "warning",
}

const bondTypeLabel: Record<string, string> = {
  SELIC: "SELIC",
  IPCA: "IPCA+",
  PREFIXADO: "Prefixado",
  IPCA_JUROS: "IPCA+ Juros",
  PREFIXADO_JUROS: "Pref. Juros",
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-BR")
  } catch { return dateStr }
}

export default async function RendaFixaPage() {
  const [rates, bonds] = await Promise.all([fetchAllRates(), fetchTesouroBonds()])

  const rateCards = [
    { label: "CDI (a.a.)", value: rates.cdi, icon: Banknote, desc: "Taxa Interbancária" },
    { label: "SELIC (a.a.)", value: rates.selic, icon: Activity, desc: "Meta Banco Central" },
    { label: "IPCA (a.m.)", value: rates.ipca, icon: TrendingUp, desc: "Inflação oficial" },
    { label: "IGP-M (a.m.)", value: rates.igpm, icon: BarChart, desc: "Inflação FGV" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Renda Fixa</h1>
        <p className="text-muted-foreground">Tesouro Direto, CDB, LCI/LCA e simulador de investimentos</p>
      </div>

      {/* Rate Cards */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Taxas de Referência</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {rateCards.map((r) => {
            const Icon = r.icon
            return (
              <Card key={r.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                  </div>
                  <p className="text-3xl font-bold tabular-nums">
                    {r.value > 0 ? `${r.value.toFixed(2)}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Tesouro Direto */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Tesouro Direto</h2>
          <span className="text-xs text-muted-foreground">Atualizado a cada 15 min</span>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Título</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Taxa (compra)</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Preço (compra)</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {bonds.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando dados do Tesouro...</td></tr>
                ) : bonds.map((b) => (
                  <tr key={b.code} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium">{b.name}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={(bondTypeBadge[b.type] as "default" | "success" | "warning") || "default"}>
                        {bondTypeLabel[b.type] || b.type}
                      </Badge>
                    </td>
                    <td className="p-4 text-right tabular-nums">{formatDate(b.expiryDate)}</td>
                    <td className="p-4 text-right tabular-nums font-semibold text-emerald-500">
                      {b.buyRate > 0 ? `${b.buyRate.toFixed(2)}%` : "—"}
                    </td>
                    <td className="p-4 text-right tabular-nums">{b.buyPrice > 0 ? formatCurrency(b.buyPrice) : "—"}</td>
                    <td className="p-4 text-right tabular-nums">{formatCurrency(b.minAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Simulador */}
      <section>
        <h2 className="font-semibold mb-3">Simulador de Renda Fixa</h2>
        <RendaFixaSimulador cdi={rates.cdi} ipca={rates.ipca} selic={rates.selic} />
      </section>
    </div>
  )
}
