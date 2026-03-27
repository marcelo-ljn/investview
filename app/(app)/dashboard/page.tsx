import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Olá, {session.user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">Aqui está seu resumo de investimentos</p>
      </div>

      {/* Rate Cards */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Taxas de Referência</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "CDI", value: "10,40%", change: "+0,25%", positive: true },
            { label: "SELIC", value: "10,50%", change: "+0,25%", positive: true },
            { label: "IPCA", value: "4,83%", change: "-0,12%", positive: false },
            { label: "IGP-M", value: "3,69%", change: "+0,08%", positive: true },
          ].map((rate) => (
            <Card key={rate.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{rate.label} (a.a.)</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{rate.value}</p>
                <p className={`text-xs mt-1 ${rate.positive ? "text-emerald-500" : "text-red-500"}`}>
                  {rate.change} no mês
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Explorar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/acoes", label: "Ações", desc: "Bolsa BR e US", icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
            { href: "/fiis", label: "FIIs", desc: "Fundos imobiliários", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
            { href: "/renda-fixa", label: "Renda Fixa", desc: "Tesouro, CDB, LCI", icon: Percent, color: "text-amber-500 bg-amber-500/10" },
            { href: "/portfolio", label: "Meu Portfolio", desc: "Acompanhe seus ativos", icon: TrendingDown, color: "text-purple-500 bg-purple-500/10" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <a key={item.href} href={item.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
