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
  })

  const isManual = MANUAL_VALUE_TYPES.includes(form.assetType)

  function handleAssetTypeChange(v: string) {
    setForm(f => ({
      ...f,
      assetType: v,
      ticker: "",
      // For manual types, default qty=1
      quantity: MANUAL_VALUE_TYPES.includes(v) ? "1" : f.quantity,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const ticker = isManual ? form.ticker : form.ticker.toUpperCase()
      const res = await fetch(`/api/portfolio/${portfolioId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticker,
          quantity: Number(form.quantity),
          price: Number(form.price),
          fees: Number(form.fees),
        }),
      })
      if (res.ok) {
        setOpen(false)
        setForm({ ticker: "", assetType: "STOCK", type: "BUY", date: new Date().toISOString().split("T")[0], quantity: "", price: "", fees: "0", notes: "" })
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
                <Label>{isManual ? "Valor investido / atual (R$)" : "Preço unitário (R$)"}</Label>
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

            {isManual && (
              <p className="text-xs text-muted-foreground">
                Para renda fixa e outros, o valor é armazenado diretamente. Atualize manualmente quando o valor mudar.
              </p>
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
