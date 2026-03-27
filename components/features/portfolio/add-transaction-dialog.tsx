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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticker: form.ticker.toUpperCase(),
          quantity: Number(form.quantity),
          price: Number(form.price),
          fees: Number(form.fees),
        }),
      })
      if (res.ok) {
        setOpen(false)
        setForm({ ticker: "", assetType: "STOCK", type: "BUY", date: new Date().toISOString().split("T")[0], quantity: "", price: "", fees: "0", notes: "" })
        onSuccess?.()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Adicionar operação
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar operação</DialogTitle>
            <DialogDescription>Registre uma compra, venda ou recebimento de dividendo</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ticker</Label>
                <Input
                  placeholder="Ex: PETR4"
                  value={form.ticker}
                  onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de ativo</Label>
                <Select value={form.assetType} onValueChange={v => setForm(f => ({ ...f, assetType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">Ação BR</SelectItem>
                    <SelectItem value="FII">FII</SelectItem>
                    <SelectItem value="ETF">ETF</SelectItem>
                    <SelectItem value="US_STOCK">Ação US</SelectItem>
                    <SelectItem value="CRYPTO">Cripto</SelectItem>
                    <SelectItem value="FIXED_INCOME">Renda Fixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operação</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Compra</SelectItem>
                    <SelectItem value="SELL">Venda</SelectItem>
                    <SelectItem value="DIVIDEND">Dividendo</SelectItem>
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
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="0.001" step="any" required />
              </div>
              <div className="space-y-1.5">
                <Label>Preço unitário (R$)</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0.001" step="0.01" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Taxas e corretagem (R$)</Label>
              <Input type="number" placeholder="0.00" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} min="0" step="0.01" />
            </div>

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
