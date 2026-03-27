"use client"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface Position {
  ticker: string
  assetType: string
  currentValue: number
  weight: number
}

interface Props {
  positions: Position[]
  totalValue: number
}

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#84cc16","#f97316","#ec4899","#6366f1",
  "#14b8a6","#eab308","#a855f7","#0ea5e9","#22c55e",
]

export function AllocationChart({ positions, totalValue }: Props) {
  // By position (top 8 + others)
  const sorted = [...positions].sort((a, b) => b.currentValue - a.currentValue)
  const top8 = sorted.slice(0, 8)
  const others = sorted.slice(8)
  const othersValue = others.reduce((s, p) => s + p.currentValue, 0)

  const pieData = [
    ...top8.map(p => ({ name: p.ticker, value: p.currentValue, weight: p.weight })),
    ...(othersValue > 0 ? [{ name: "Outros", value: othersValue, weight: (othersValue / totalValue) * 100 }] : []),
  ]

  // By asset type
  const typeMap: Record<string, number> = {}
  positions.forEach(p => {
    typeMap[p.assetType] = (typeMap[p.assetType] ?? 0) + p.currentValue
  })
  const typeData = Object.entries(typeMap).map(([name, value]) => ({
    name: name === "STOCK" ? "Ações" : name === "FII" ? "FIIs" : name,
    value,
    weight: (value / totalValue) * 100,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* By ticker */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Por ativo</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v))]}
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="space-y-1 mt-2">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="font-medium">{d.name}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-muted-foreground">{formatCurrency(d.value)}</span>
                <span className="font-semibold w-10 text-right">{d.weight.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By type */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Por tipo de ativo</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, weight }: { name?: string; weight?: number }) => `${name} ${(weight ?? 0).toFixed(0)}%`}
              labelLine={false}
            >
              {typeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i * 3 % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v))]}
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1 mt-2">
          {typeData.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i * 3 % COLORS.length] }} />
                <span className="font-medium">{d.name}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-muted-foreground">{formatCurrency(d.value)}</span>
                <span className="font-semibold w-10 text-right">{d.weight.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
