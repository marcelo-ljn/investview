"use client"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Flame, Target, Clock, TrendingUp } from "lucide-react"

function calcYearsToFIRE(
  patrimonio: number,
  aporteMensal: number,
  annualReturn: number, // % ao ano
  fireNumber: number
): number {
  if (patrimonio >= fireNumber) return 0
  const monthlyRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1
  let balance = patrimonio
  for (let month = 1; month <= 600; month++) { // max 50 anos
    balance = balance * (1 + monthlyRate) + aporteMensal
    if (balance >= fireNumber) return month / 12
  }
  return Infinity
}

function buildProjection(
  patrimonio: number,
  aporteMensal: number,
  annualReturn: number,
  years: number
): { year: number; value: number }[] {
  const monthlyRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1
  let balance = patrimonio
  const data = [{ year: 0, value: Math.round(balance) }]
  for (let m = 1; m <= years * 12; m++) {
    balance = balance * (1 + monthlyRate) + aporteMensal
    if (m % 12 === 0) data.push({ year: m / 12, value: Math.round(balance) })
  }
  return data
}

export function FIRESimulator() {
  const [patrimonio, setPatrimonio] = useState(100000)
  const [aporte, setAporte] = useState(3000)
  const [retorno, setRetorno] = useState(10)
  const [inflacao, setInflacao] = useState(4.5)
  const [rendaMensal, setRendaMensal] = useState(10000)

  const rendaAnual = rendaMensal * 12
  const retornoReal = retorno - inflacao
  const fireNumber = rendaAnual / 0.04 // regra dos 4%
  const fireNumberReal = (rendaMensal / (retornoReal / 100 / 12)) // alternativa

  const anosConservador = calcYearsToFIRE(patrimonio, aporte, Math.max(retorno - 2, 1), fireNumber)
  const anosModerate = calcYearsToFIRE(patrimonio, aporte, retorno, fireNumber)
  const anosOtimista = calcYearsToFIRE(patrimonio, aporte, retorno + 2, fireNumber)

  const maxYears = Math.min(
    Math.ceil(isFinite(anosConservador) ? anosConservador + 5 : 40),
    50
  )

  const projConservador = buildProjection(patrimonio, aporte, Math.max(retorno - 2, 1), maxYears)
  const projModerado = buildProjection(patrimonio, aporte, retorno, maxYears)
  const projOtimista = buildProjection(patrimonio, aporte, retorno + 2, maxYears)

  // Merge projections into single chart data
  const chartData = projModerado.map((d, i) => ({
    ano: `Ano ${d.year}`,
    "Conservador": projConservador[i]?.value ?? null,
    "Moderado": d.value,
    "Otimista": projOtimista[i]?.value ?? null,
    fireNumber: fireNumber,
  }))

  // Sensitivity analysis
  const sensitivityAportes = [0, 500, 1000, 2000, 5000]

  return (
    <div className="space-y-8">
      {/* FIRE Target Banner */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-6 w-6 text-amber-500" />
          <h2 className="text-lg font-semibold">Seu FIRE Number</h2>
        </div>
        <p className="text-4xl font-bold tabular-nums text-amber-500">
          {formatCurrency(fireNumber)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Patrimônio necessário para viver de renda (regra dos 4%: {formatCurrency(rendaMensal)}/mês)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seus dados</CardTitle>
            <CardDescription>Configure para personalizar a simulação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patrimônio atual</Label>
              <Input type="number" value={patrimonio} onChange={e => setPatrimonio(Number(e.target.value))} min={0} step={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>Aporte mensal</Label>
              <Input type="number" value={aporte} onChange={e => setAporte(Number(e.target.value))} min={0} step={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Retorno anual esperado (%)</Label>
              <Input type="number" value={retorno} onChange={e => setRetorno(Number(e.target.value))} min={1} max={30} step={0.5} />
            </div>
            <div className="space-y-1.5">
              <Label>Inflação anual (%)</Label>
              <Input type="number" value={inflacao} onChange={e => setInflacao(Number(e.target.value))} min={0} max={20} step={0.25} />
            </div>
            <div className="space-y-1.5">
              <Label>Renda mensal desejada (R$)</Label>
              <Input type="number" value={rendaMensal} onChange={e => setRendaMensal(Number(e.target.value))} min={1000} step={500} />
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-medium">Retorno real (descontando inflação)</p>
              <p className="text-emerald-500 text-base font-bold">{(retorno - inflacao).toFixed(1)}% a.a.</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scenario cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Conservador", anos: anosConservador, color: "text-red-500", bg: "bg-red-500/10", icon: "🐢" },
              { label: "Moderado", anos: anosModerate, color: "text-amber-500", bg: "bg-amber-500/10", icon: "⚖️" },
              { label: "Otimista", anos: anosOtimista, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: "🚀" },
            ].map(s => (
              <Card key={s.label} className={`border-0 ${s.bg}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold tabular-nums mt-1 ${s.color}`}>
                    {isFinite(s.anos) ? `${s.anos.toFixed(1)}` : "∞"}
                  </p>
                  <p className="text-xs text-muted-foreground">anos</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Evolução patrimonial — 3 cenários</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    {[
                      { id: "colorC", color: "#ef4444" },
                      { id: "colorM", color: "#f59e0b" },
                      { id: "colorO", color: "#10b981" },
                    ].map(g => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={g.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} vertical={false} />
                  <XAxis dataKey="ano" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(maxYears / 8)} />
                  <YAxis tickFormatter={v => `R$${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 11 }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Conservador" stroke="#ef4444" fill="url(#colorC)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Moderado" stroke="#f59e0b" fill="url(#colorM)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Otimista" stroke="#10b981" fill="url(#colorO)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise de sensibilidade — Impacto do aporte mensal
          </CardTitle>
          <CardDescription>Como o aporte mensal afeta o tempo até o FIRE</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Aporte mensal</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Anos até FIRE</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityAportes.map((extra) => {
                  const totalAporte = aporte + extra
                  const anos = calcYearsToFIRE(patrimonio, totalAporte, retorno, fireNumber)
                  const diff = anos - anosModerate
                  return (
                    <tr key={extra} className={`border-b border-border last:border-0 ${extra === 0 ? "bg-muted/50 font-medium" : ""}`}>
                      <td className="p-3">
                        {formatCurrency(totalAporte)}/mês
                        {extra === 0 && <Badge variant="secondary" className="ml-2 text-xs">atual</Badge>}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {isFinite(anos) ? `${anos.toFixed(1)} anos` : "Impossível"}
                      </td>
                      <td className={`p-3 text-right tabular-nums ${diff < 0 ? "text-emerald-500" : diff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {extra === 0 ? "—" : isFinite(diff) ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)} anos` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
