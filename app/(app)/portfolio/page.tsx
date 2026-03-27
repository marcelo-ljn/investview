import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Portfolio" }

export default async function PortfolioPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // TODO: fetch real portfolio data from DB
  const isEmpty = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Portfolio</h1>
          <p className="text-muted-foreground">Acompanhe seus investimentos em tempo real</p>
        </div>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Adicionar ativo
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Nenhum ativo cadastrado</h2>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Adicione seus primeiros ativos para começar a acompanhar o desempenho do seu portfolio
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Adicionar ativo
            </Button>
            <Button variant="outline">Importar via planilha</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Patrimônio total", value: "R$ 0,00", icon: DollarSign, color: "text-blue-500 bg-blue-500/10" },
            { label: "Variação hoje", value: "+R$ 0,00", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
            { label: "Dividendos (mês)", value: "R$ 0,00", icon: DollarSign, color: "text-amber-500 bg-amber-500/10" },
            { label: "Resultado total", value: "+R$ 0,00", icon: BarChart3, color: "text-purple-500 bg-purple-500/10" },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
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
