"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Loader2 } from "lucide-react"

interface AddTransactionDialogProps {
  portfolioId: string
  onSuccess?: () => void
}

// Asset types that don't have market tickers — value is stored directly
const MANUAL_VALUE_TYPES = ["FIXED_INCOME", "OTHER"]

const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: "Ação BR",
  FII: "FII",
  ETF: "ETF",
  US_STOCK: "Ação US",
  CRYPTO: "Cripto",
  FIXED_INCOME: "Renda Fixa",
  OTHER: "Outros",
}

const INDEXER_OPTIONS = [
  { value: "CDI",       label: "CDI (%)" },
  { value: "CDI_PLUS",  label: "CDI+ (spread a.a.)" },
  { value: "SELIC",     label: "SELIC (%)" },
  { value: "IPCA",      label: "IPCA + spread" },
  { value: "IPCA_PLUS", label: "IPCA+ (spread a.a.)" },
  { value: "IGPM",      label: "IGPM+ (spread a.a.)" },
  { value: "PREFIXADO", label: "Pré-fixado (a.a.)" },
]

function getRateLabel(indexer: string): string {
  if (indexer === "CDI" || indexer === "SELIC") return "% do índice (ex: 110)"
  if (indexer === "PREFIXADO") return "Taxa a.a. (ex: 13.5)"
  return "Spread a.a. (ex: 5.5)"
}

function getRatePlaceholder(indexer: string): string {
  if (indexer === "CDI") return "110"
  if (indexer === "SELIC") return "100"
  if (indexer === "PREFIXADO") return "13.5"
  return "5.5"
}

export function AddTransactionDialog({ portfolioId, onSuccess }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    ticker: "",
    assetType: "STOCK",
    type: "BUY",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    price: "",
    fees: "0",
    notes: "",
    indexer: "",
    rate: "",
  })

  const isManual = MANUAL_VALUE_TYPES.includes(form.assetType)

  function handleAssetTypeChange(v: string) {
    setForm(f => ({
      ...f,
      assetType: v,
      ticker: "",
      quantity: MANUAL_VALUE_TYPES.includes(v) ? "1" : f.quantity,
      indexer: "",
      rate: "",
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const ticker = isManual ? form.ticker : form.ticker.toUpperCase()
      const body: Record<string, unknown> = {
        ...form,
        ticker,
        quantity: Number(form.quantity),
        price: Number(form.price),
        fees: Number(form.fees),
      }
      // Only include indexer/rate when set and relevant
      if (!isManual || !form.indexer) {
        delete body.indexer
        delete body.rate
      } else {
        body.indexer = form.indexer
        body.rate = form.rate ? Number(form.rate) : undefined
        if (!body.rate) delete body.rate
      }

      const res = await fetch(`/api/portfolio/${portfolioId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setOpen(false)
        setForm({ ticker: "", assetType: "STOCK", type: "BUY", date: new Date().toISOString().split("T")[0], quantity: "", price: "", fees: "0", notes: "", indexer: "", rate: "" })
        onSuccess?.()
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Adicionar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar operação</DialogTitle>
            <DialogDescription>Registre uma compra, venda, resgate ou recebimento</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Asset type first */}
            <div className="space-y-1.5">
              <Label>Tipo de ativo</Label>
              <Select value={form.assetType} onValueChange={handleAssetTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ticker or name */}
            <div className="space-y-1.5">
              <Label>{isManual ? "Nome do ativo" : "Ticker"}</Label>
              <Input
                placeholder={isManual
                  ? (form.assetType === "FIXED_INCOME" ? "Ex: CDB Mercado Pago 110% CDI" : "Ex: Empréstimo Pessoal")
                  : "Ex: PETR4, BTC, VOO"}
                value={form.ticker}
                onChange={e => setForm(f => ({ ...f, ticker: isManual ? e.target.value : e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operação</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Compra / Aplicação</SelectItem>
                    <SelectItem value="SELL">Venda / Resgate</SelectItem>
                    <SelectItem value="DIVIDEND">Dividendo / Rendimento</SelectItem>
                    <SelectItem value="JCP">JCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!isManual && (
                <div className="space-y-1.5">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    min="0.00000001"
                    step="any"
                    required
                  />
                </div>
              )}
              <div className={`space-y-1.5 ${isManual ? "col-span-2" : ""}`}>
                <Label>{isManual ? "Valor atual / saldo (R$)" : "Preço unitário (R$)"}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {!isManual && (
              <div className="space-y-1.5">
                <Label>Taxas e corretagem (R$)</Label>
                <Input type="number" placeholder="0.00" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} min="0" step="0.01" />
              </div>
            )}

            {/* Indexer + Rate fields for FIXED_INCOME / OTHER */}
            {isManual && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Indexador <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
                  <Select
                    value={form.indexer}
                    onValueChange={v => setForm(f => ({ ...f, indexer: v, rate: "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Sem índice" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem índice</SelectItem>
                      {INDEXER_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.indexer && (
                  <div className="space-y-1.5">
                    <Label>{getRateLabel(form.indexer)}</Label>
                    <Input
                      type="number"
                      placeholder={getRatePlaceholder(form.indexer)}
                      value={form.rate}
                      onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
