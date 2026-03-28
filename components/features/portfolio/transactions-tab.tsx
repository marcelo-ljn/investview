"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Search, TrendingUp, TrendingDown, DollarSign, RotateCcw, Trash2, AlertTriangle, Pencil } from "lucide-react"
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

const VALUE_BASED = ["FIXED_INCOME", "OTHER"]

export function TransactionsTab({ transactions, portfolioId }: TransactionsTabProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [assetFilter, setAssetFilter] = useState("ALL")
  const [rebuilding, setRebuilding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [localTxs, setLocalTxs] = useState(transactions)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState<Partial<Transaction>>({})
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    return localTxs.filter(tx => {
      const matchSearch = search === "" || tx.ticker.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "ALL" || tx.type === typeFilter
      const matchAsset = assetFilter === "ALL" || tx.assetType === assetFilter
      return matchSearch && matchType && matchAsset
    })
  }, [localTxs, search, typeFilter, assetFilter])

  async function handleRebuild() {
    if (!confirm("Isso vai recalcular todas as posições a partir do histórico de transações. Confirmar?")) return
    setRebuilding(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/positions/rebuild`, { method: "POST" })
      if (res.ok) window.location.reload()
    } finally {
      setRebuilding(false)
    }
  }

  async function handleDelete(txId: string) {
    if (!confirm("Excluir este lançamento? As posições serão recalculadas automaticamente.")) return
    setDeletingId(txId)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/transactions/${txId}`, { method: "DELETE" })
      if (res.ok) {
        setLocalTxs(prev => prev.filter(t => t.id !== txId))
        window.location.reload()
      }
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setEditForm({
      ticker: tx.ticker,
      assetType: tx.assetType,
      type: tx.type,
      date: new Date(tx.date).toISOString().split("T")[0],
      quantity: tx.quantity,
      price: tx.price,
      fees: tx.fees,
      notes: tx.notes ?? "",
    })
  }

  async function handleSaveEdit() {
    if (!editingTx) return
    setSaving(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/transactions/${editingTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingTx(null)
        window.location.reload()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleResetAll() {
    if (!confirm("⚠️ ATENÇÃO: isso vai apagar TODOS os lançamentos e posições da carteira. Esta ação não pode ser desfeita. Confirmar?")) return
    if (!confirm("Tem certeza? Todos os dados serão perdidos.")) return
    setResetting(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/positions`, { method: "DELETE" })
      if (res.ok) window.location.reload()
    } finally {
      setResetting(false)
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
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleRebuild} disabled={rebuilding} className="gap-2">
            <RotateCcw className={`h-3.5 w-3.5 ${rebuilding ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetAll} disabled={resetting} className="gap-2 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10">
            <AlertTriangle className="h-3.5 w-3.5" />
            Zerar tudo
          </Button>
        </div>
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
                <th className="w-10" />
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
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tx)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar lançamento"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-50"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    {/* Edit modal */}
    <Dialog open={!!editingTx} onOpenChange={v => { if (!v) setEditingTx(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>
        {editingTx && (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{VALUE_BASED.includes(editForm.assetType ?? "") ? "Nome do ativo" : "Ticker"}</Label>
              <Input
                value={editForm.ticker ?? ""}
                onChange={e => setEditForm(f => ({ ...f, ticker: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operação</Label>
                <Select value={editForm.type ?? ""} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={editForm.date as string ?? ""} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {!VALUE_BASED.includes(editForm.assetType ?? "") && (
                <div className="space-y-1.5">
                  <Label>Quantidade</Label>
                  <Input type="number" step="any" value={editForm.quantity ?? ""} onChange={e => setEditForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
              )}
              <div className={`space-y-1.5 ${VALUE_BASED.includes(editForm.assetType ?? "") ? "col-span-2" : ""}`}>
                <Label>{VALUE_BASED.includes(editForm.assetType ?? "") ? "Valor (R$)" : "Preço unit. (R$)"}</Label>
                <Input type="number" step="0.01" value={editForm.price ?? ""} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>
            {!VALUE_BASED.includes(editForm.assetType ?? "") && (
              <div className="space-y-1.5">
                <Label>Taxas (R$)</Label>
                <Input type="number" step="0.01" value={editForm.fees ?? 0} onChange={e => setEditForm(f => ({ ...f, fees: Number(e.target.value) }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Obs.</Label>
              <Input value={editForm.notes ?? ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingTx(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </div>
  )
}
