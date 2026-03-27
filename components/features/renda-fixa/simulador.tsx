"use client"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatPercent, simulateFixedIncome, calcIR } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SimuladorProps {
  cdi: number
  ipca: number
  selic: number
}

type IndexerType = "cdi_pct" | "ipca_plus" | "prefixado" | "selic"

export function RendaFixaSimulador({ cdi, ipca, selic }: SimuladorProps) {
  const [principal, setPrincipal] = useState(10000)
  const [monthly, setMonthly] = useState(500)
  const [months, setMonths] = useState(24)
  const [indexer, setIndexer] = useState<IndexerType>("cdi_pct")
  const [cdiPct, setCdiPct] = useState(110)
  const [ipcaPlus, setIpcaPlus] = useState(6)
  const [prefRate, setPrefRate] = useState(12)

  // Calcula taxa anual efetiva baseada no indexador
  const annualRate = useMemo(() => {
    switch (indexer) {
      case "cdi_pct": return cdi * (cdiPct / 100) || 10.5 * (cdiPct / 100)
      case "ipca_plus": return (ipca * 12 || 4.8) + ipcaPlus
      case "prefixado": return prefRate
      case "selic": return selic || 10.5
      default: return 10
    }
  }, [indexer, cdi, ipca, selic, cdiPct, ipcaPlus, prefRate])

  const days = months * 30
  const irRate = calcIR(days)

  const data = useMemo(() =>
    simulateFixedIncome({ principal, monthlyContribution: monthly, annualRate, months, taxRate: irRate }),
    [principal, monthly, annualRate, months, irRate]
  )

  const last = data[data.length - 1]
  const totalInvested = last?.contributed ?? principal
  const grossReturn = last?.gross ?? principal
  const netReturn = last?.net ?? principal

  // Pontos para o gráfico (simplifica para não sobrecarregar)
  const chartData = data
    .filter((_, i) => i % Math.max(1, Math.floor(months / 24)) === 0 || i === data.length - 1)
    .map((d) => ({
      mes: `M${d.month}`,
      "Valor bruto": Math.round(d.gross),
      "Valor líquido": Math.round(d.net),
      "Aportado": Math.round(d.contributed),
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Inputs */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Valor inicial</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Aporte mensal</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} min={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (meses)</Label>
            <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} min={1} max={360} />
          </div>
          <div className="space-y-1.5">
            <Label>Indexador</Label>
            <Select value={indexer} onValueChange={(v) => setIndexer(v as IndexerType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi_pct">% do CDI</SelectItem>
                <SelectItem value="ipca_plus">IPCA+</SelectItem>
                <SelectItem value="prefixado">Prefixado</SelectItem>
                <SelectItem value="selic">SELIC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {indexer === "cdi_pct" && (
            <div className="space-y-1.5">
              <Label>% do CDI</Label>
              <Input type="number" value={cdiPct} onChange={(e) => setCdiPct(Number(e.target.value))} min={50} max={200} step={5} />
              <p className="text-xs text-muted-foreground">= {annualRate.toFixed(2)}% a.a.</p>
            </div>
          )}
          {indexer === "ipca_plus" && (
            <div className="space-y-1.5">
              <Label>IPCA + %</Label>
              <Input type="number" value={ipcaPlus} onChange={(e) => setIpcaPlus(Number(e.target.value))} min={0} max={20} step={0.25} />
              <p className="text-xs text-muted-foreground">= {annualRate.toFixed(2)}% a.a.</p>
            </div>
          )}
          {indexer === "prefixado" && (
            <div className="space-y-1.5">
              <Label>Taxa prefixada (%)</Label>
              <Input type="number" value={prefRate} onChange={(e) => setPrefRate(Number(e.target.value))} min={0} max={30} step={0.25} />
            </div>
          )}

          {/* IR Info */}
          <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
            <p className="font-medium">IR Regressivo</p>
            <p className="text-muted-foreground">
              {days <= 180 ? "22,5%" : days <= 360 ? "20%" : days <= 720 ? "17,5%" : "15%"} ({Math.round(months / 12)} {months >= 12 ? "anos" : "meses"})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results + Chart */}
      <div className="lg:col-span-2 space-y-4">
        {/* Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total investido</p>
              <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(totalInvested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Valor bruto</p>
              <p className="text-xl font-bold tabular-nums text-blue-500 mt-1">{formatCurrency(grossReturn)}</p>
              <p className="text-xs text-emerald-500">+{formatCurrency(grossReturn - totalInvested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Valor líquido (IR)</p>
              <p className="text-xl font-bold tabular-nums text-emerald-500 mt-1">{formatCurrency(netReturn)}</p>
              <p className="text-xs text-emerald-500">+{formatCurrency(netReturn - totalInvested)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolução patrimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} labelStyle={{ color: "var(--foreground)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px" }} />
                <Legend />
                <Area type="monotone" dataKey="Aportado" stroke="#6366f1" fill="url(#colorInvested)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Valor bruto" stroke="#3b82f6" fill="url(#colorGross)" strokeWidth={2} />
                <Area type="monotone" dataKey="Valor líquido" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
