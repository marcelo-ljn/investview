import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, ShieldCheck, Zap } from "lucide-react"

export default async function HomePage() {
  const session = await auth()
  if (session) redirect("/portfolio")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1.5">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">InvestView</span>
        </div>
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </header>

      <main className="px-6 py-24 max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
            Plataforma 100% gratuita
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Invista com mais{" "}
            <span className="text-primary">inteligência</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Acompanhe ações, FIIs, renda fixa e muito mais com gráficos avançados, simulações e projeções personalizadas — tudo em um só lugar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Começar gratuitamente</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/acoes">Ver ações</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { icon: BarChart3, title: "Gráficos avançados", desc: "Candlestick, médias móveis, RSI, MACD e mais. Muito além do básico." },
            { icon: Zap, title: "Simulações em tempo real", desc: "Simule renda fixa com IR automático, projeções FIRE e independência financeira." },
            { icon: ShieldCheck, title: "Portfolio completo", desc: "Acompanhe P&L, dividendos recebidos e rebalanceamento da sua carteira." },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-xl border border-border p-6 text-left space-y-3">
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
