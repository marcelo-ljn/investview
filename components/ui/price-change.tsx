import { cn, formatPercent, variationColor } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PriceChangeProps {
  value: number
  showIcon?: boolean
  className?: string
}

export function PriceChange({ value, showIcon = true, className }: PriceChangeProps) {
  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", variationColor(value), className)}>
      {showIcon && (
        isPositive ? <TrendingUp className="h-3.5 w-3.5" /> :
        isNegative ? <TrendingDown className="h-3.5 w-3.5" /> :
        <Minus className="h-3.5 w-3.5" />
      )}
      {formatPercent(value)}
    </span>
  )
}
