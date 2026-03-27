import { cn, formatPercent, variationBg } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface VariationBadgeProps {
  value: number
  className?: string
  size?: "sm" | "md"
}

export function VariationBadge({ value, className, size = "md" }: VariationBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-md font-medium tabular-nums",
      size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
      variationBg(value),
      className
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {formatPercent(value)}
    </span>
  )
}
