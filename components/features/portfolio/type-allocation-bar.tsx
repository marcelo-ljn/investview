"use client"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

interface Position {
  assetType: string
  currentValue: number
}

interface Props {
  positions: Position[]
  totalValue: number
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  FIXED_INCOME: { label: "Renda Fixa", color: "#f43f5e", bg: "bg-rose-500" },
  STOCK:        { label: "Ações BR",   color: "#3b82f6", bg: "bg-blue-500" },
  FII:          { label: "FIIs",       color: "#10b981", bg: "bg-emerald-500" },
  ETF:          { label: "ETFs",       color: "#8b5cf6", bg: "bg-violet-500" },
  US_STOCK:     { label: "Ações US",   color: "#06b6d4", bg: "bg-cyan-500" },
  CRYPTO:       { label: "Cripto",     color: "#f59e0b", bg: "bg-amber-500" },
  OTHER:        { label: "Outros",     color: "#71717a", bg: "bg-zinc-500" },
}

export function TypeAllocationBar({ positions, totalValue }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Aggregate by type
  const typeMap: Record<string, number> = {}
  for (const p of positions) {
    typeMap[p.assetType] = (typeMap[p.assetType] ?? 0) + p.currentValue
  }

  // Sort by value desc
  const segments = Object.entries(typeMap)
    .map(([type, value]) => ({
      type,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
      ...(TYPE_CONFIG[type] ?? { label: type, color: "#71717a", bg: "bg-zinc-500" }),
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-8 w-full rounded-lg overflow-hidden gap-0.5">
        {segments.map(seg => (
          <div
            key={seg.type}
            className="relative h-full flex items-center justify-center transition-all cursor-default"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color, opacity: hovered && hovered !== seg.type ? 0.5 : 1 }}
            onMouseEnter={() => setHovered(seg.type)}
            onMouseLeave={() => setHovered(null)}
            title={`${seg.label}: ${formatCurrency(seg.value)} (${seg.pct.toFixed(1)}%)`}
          >
            {seg.pct > 8 && (
              <span className="text-[10px] font-bold text-white drop-shadow-sm select-none">
                {seg.pct.toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map(seg => (
          <div
            key={seg.type}
            className="flex items-center gap-1.5 text-xs cursor-default"
            onMouseEnter={() => setHovered(seg.type)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
            <span className={hovered === seg.type ? "text-foreground font-medium" : "text-muted-foreground"}>
              {seg.label}
            </span>
            <span className="tabular-nums font-semibold">{formatCurrency(seg.value)}</span>
            <span className="text-muted-foreground">({seg.pct.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
