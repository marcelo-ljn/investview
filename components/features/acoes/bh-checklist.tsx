import { CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  price: number
  pl?: number
  pvp?: number
  dy?: number
  eps?: number
}

interface CheckItem {
  label: string
  pass: boolean | null
  value: string
  hint: string
}

export function BHChecklist({ pl, pvp, dy, eps }: Props) {
  const checks: CheckItem[] = [
    {
      label: "P/L ≤ 15",
      pass: pl != null ? pl > 0 && pl <= 15 : null,
      value: pl != null && pl > 0 ? pl.toFixed(1) : "—",
      hint: "Preço/Lucro baixo indica ação barata em relação ao lucro gerado.",
    },
    {
      label: "P/VP ≤ 1,5",
      pass: pvp != null ? pvp > 0 && pvp <= 1.5 : null,
      value: pvp != null ? pvp.toFixed(2) : "—",
      hint: "Abaixo de 1,0 significa comprar ativos por menos que o valor patrimonial.",
    },
    {
      label: "DY ≥ 6% ao ano",
      pass: dy != null ? dy * 100 >= 6 : null,
      value: dy != null ? `${(dy * 100).toFixed(2)}%` : "—",
      hint: "Dividend Yield anualizado acima de 6% supera a maioria dos CDBs.",
    },
    {
      label: "LPA > 0 (empresa lucrativa)",
      pass: eps != null ? eps > 0 : null,
      value: eps != null ? `R$ ${eps.toFixed(2)}` : "—",
      hint: "Lucro por Ação positivo é pré-requisito para o método B&H.",
    },
    {
      label: "P/L × P/VP ≤ 22,5 (Graham)",
      pass:
        pl != null && pvp != null && pl > 0 && pvp > 0
          ? pl * pvp <= 22.5
          : null,
      value:
        pl != null && pvp != null && pl > 0 && pvp > 0
          ? (pl * pvp).toFixed(1)
          : "—",
      hint: "Critério duplo de Graham — combinação de preço e patrimônio.",
    },
  ]

  const evaluated = checks.filter((c) => c.pass !== null)
  const passed = evaluated.filter((c) => c.pass === true).length
  const score = evaluated.length > 0 ? (passed / evaluated.length) * 100 : 0
  const scoreColor =
    score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500"
  const scoreLabel =
    score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Moderado" : "Atenção"
  const ringColor =
    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Score Buy &amp; Hold</p>
            <p className={`text-3xl font-bold tabular-nums ${scoreColor}`}>
              {passed}/{evaluated.length}
            </p>
            <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
          </div>
          <div
            className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: ringColor }}
          >
            <span className={`text-sm font-bold ${scoreColor}`}>{score.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {checks.map((c) => {
          const Icon =
            c.pass === true ? CheckCircle2 : c.pass === false ? XCircle : MinusCircle
          const color =
            c.pass === true
              ? "text-emerald-500"
              : c.pass === false
              ? "text-red-500"
              : "text-muted-foreground"
          return (
            <Card key={c.label}>
              <CardContent className="p-3 flex items-start gap-3">
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className={`text-sm font-bold tabular-nums shrink-0 ${color}`}>{c.value}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.hint}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
