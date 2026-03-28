"use client"
import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"

interface ProjectionTabProps {
  currentValue: number
  currentCost: number
}

function calcProjection(
  initial: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
) {
  const data = []
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const inflationMonthly = Math.pow(1 + 0.05, 1 / 12) - 1 // ~5% IPCA ao ano

  let withContrib = initial
  let withoutContrib = initial
  let inflationAdjusted = initial

  data.push({
    label: "Hoje",
    comAporte: initial,
    semAporte: initial,
    inflacao: initial,
  })

  const totalMonths = years * 12
  for (let m = 1; m <= totalMonths; m++) {
    withContrib = withContrib * (1 + monthlyRate) + monthlyContribution
    withoutContrib = withoutContrib * (1 + monthlyRate)
    inflationAdjusted = inflationAdjusted * (1 + inflationMonthly)

    if (m % 12 === 0) {
      data.push({
        label: `Ano ${m / 12}`,
        comAporte: Math.round(withContrib),
        semAporte: Math.round(withoutContrib),
        inflacao: Math.round(inflationAdjusted),
      })
    }
  }
  return { data, finalWithContrib: withContrib, finalWithoutContrib: withoutContrib }
}

export function ProjectionTab({ currentValue, currentCost }: ProjectionTabProps) {
  const [monthlyContrib, setMonthlyContrib] = useState("1000")
  const [years, setYears] = useState("10")
  const [annualRate, setAnnualRate] = useState("12")

  const { data, finalWithContrib, finalWithoutContrib } = useMemo(() => {
    return calcProjection(
      currentValue,
      Number(monthlyContrib) || 0,
      Number(annualRate) || 10,
      Math.min(Number(years) || 10, 50)
    )
  }, [currentValue, monthlyContrib, years, annualRate])

  const totalInvested = currentCost + (Number(monthlyContrib) || 0) * (Number(years) || 10) * 12
  const monthlyIncome = (finalWithContrib * ((Number(annualRate) || 10) / 100)) / 12

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Aporte mensal (R$)</Label>
            <Input
              type="number"
              value={monthlyContrib}
              onChange={e => setMonthlyContrib(e.target.value)}
              min="0"
              step="100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Horizonte (anos)</Label>
            <Input
              type="number"
              value={years}
              onChange={e => setYears(e.target.value)}
              min="1"
              max="50"
            />
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label className="text-xs">Taxa anual esperada (%)</Label>
            <Input
              type="number"
              value={annualRate}
              onChange={e => setAnnualRate(e.target.value)}
              min="1"
              max="50"
              step="0.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Patrimônio atual</p>
            <p className="font-semibold text-sm">{formatCurrency(currentValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Projeção em {years} anos</p>
            <p className="font-semibold text-sm text-blue-400">{formatCurrency(finalWithContrib)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total investido</p>
            <p className="font-semibold text-sm">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Renda passiva/mês</p>
            <p className="font-semibold text-sm text-emerald-400">{formatCurrency(monthlyIncome)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-4">Evolução projetada</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), ""]}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="inflacao"
                stroke="#6b7280"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                fill="none"
                name="Inflação (~5% a.a.)"
              />
              <Area
                type="monotone"
                dataKey="semAporte"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorSem)"
                name="Sem aportes"
              />
              <Area
                type="monotone"
                dataKey="comAporte"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCom)"
                name={`Com aportes (${formatCurrency(Number(monthlyContrib) || 0)}/mês)`}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3">
            Taxa de {annualRate}% a.a. aplicada de forma constante. Projeção não garante rentabilidade futura.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
