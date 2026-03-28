"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { Search, TrendingUp, TrendingDown, DollarSign, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: string
  ticker: string
  assetType: string
  type: string
  date: string | Date
  quantity: number
  price: number
  fees: number
  notes?: string | null
}

interface TransactionsTabProps {
  transactions: Transaction[]
  portfolioId: string
}

const TYPE_LABELS: Record<string, string> = {
  BUY: "Compra",
  SELL: "Venda / Resgate",
  DIVIDEND: "Dividendo",
  JCP: "JCP",
  AMORTIZATION: "Amortização",
  SUBSCRIPTION: "Subscrição",
}

const ASSET_LABELS: Record<string, string> = {
  STOCK: "Ação BR", FII: "FII", ETF: "ETF", US_STOCK: "Ação US",
  CRYPTO: "Cripto", FIXED_INCOME: "Renda Fixa", OTHER: "Outro",
}

function TypeIcon({ type }: { type: string }) {
  if (type === "BUY" || type === "SUBSCRIPTION") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (type === "SELL") return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
  return <DollarSign className="h-3.5 w-3.5 text-amber-500" />
}

export function TransactionsTab({ transactions, portfolioId }: TransactionsTabProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [assetFilter, setAssetFilter] = useState("ALL")
  const [rebuilding, setRebuilding] = useState(false)

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = search === "" || tx.ticker.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "ALL" || tx.type === typeFilter
      const matchAsset = assetFilter === "ALL" || tx.assetType === assetFilter
      return matchSearch && matchType && matchAsset
    })
  }, [transactions, search, typeFilter, assetFilter])

  async function handleRebuild() {
    if (!confirm("Isso vai recalcular todas as posições a partir do histórico de transações. Confirmar?")) return
    setRebuilding(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/positions/rebuild`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        alert(`Posições reconstruídas: ${data.positionsRebult} ativo(s) a partir de ${data.transactionsReplayed} transação(ões).`)
        window.location.reload()
      }
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ativo..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as classes</SelectItem>
            {Object.entries(ASSET_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleRebuild} disabled={rebuilding} className="gap-2 ml-auto">
          <RotateCcw className={`h-3.5 w-3.5 ${rebuilding ? "animate-spin" : ""}`} />
          Recalcular posições
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} lançamento(s) encontrado(s)
        {transactions.length !== filtered.length && ` de ${transactions.length} total`}
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Ativo</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Classe</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Operação</th>
                <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Qtd.</th>
                <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Preço unit.</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right p-3 font-medium text-muted-foreground hidden lg:table-cell">Taxas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              )}
              {filtered.map(tx => {
                const total = tx.quantity * tx.price
                const date = new Date(tx.date)
                return (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {date.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-xs leading-tight max-w-[140px] truncate" title={tx.ticker}>
                        {tx.ticker}
                      </p>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-[10px] text-muted-foreground">
                        {ASSET_LABELS[tx.assetType] ?? tx.assetType}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon type={tx.type} />
                        <span className="text-xs">{TYPE_LABELS[tx.type] ?? tx.type}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right tabular-nums text-xs hidden md:table-cell">
                      {tx.quantity % 1 === 0 ? tx.quantity.toFixed(0) : tx.quantity.toFixed(4)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-xs hidden md:table-cell">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className={`p-3 text-right tabular-nums text-xs font-medium ${tx.type === "SELL" || tx.type === "DIVIDEND" || tx.type === "JCP" ? "text-emerald-500" : ""}`}>
                      {tx.type === "SELL" || tx.type === "DIVIDEND" || tx.type === "JCP" ? "+" : ""}
                      {formatCurrency(total)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-xs text-muted-foreground hidden lg:table-cell">
                      {tx.fees > 0 ? formatCurrency(tx.fees) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={6} className="p-3 text-xs text-muted-foreground">
                    Total aplicado (compras)
                  </td>
                  <td className="p-3 text-right tabular-nums text-xs font-semibold">
                    {formatCurrency(
                      filtered
                        .filter(t => t.type === "BUY" || t.type === "SUBSCRIPTION")
                        .reduce((s, t) => s + t.quantity * t.price, 0)
                    )}
                  </td>
                  <td className="hidden lg:table-cell" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}
