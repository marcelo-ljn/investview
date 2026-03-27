"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { importPositions } from "@/app/(app)/portfolio/actions"
import { Upload, CheckCircle2, AlertCircle } from "lucide-react"

interface Props {
  portfolioId: string
}

const EXAMPLE = `PETR4,STOCK,100,37.50
MXRF11,FII,200,10.20
VALE3,STOCK,50,68.00`

export function ImportCsvDialog({ portfolioId }: Props) {
  const [open, setOpen] = useState(false)
  const [csv, setCsv] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    setError(null)
    const lines = csv.trim().split("\n").filter(l => l.trim())
    const rows: { ticker: string; assetType: string; quantity: number; averagePrice: number }[] = []

    for (const line of lines) {
      const parts = line.split(",").map(s => s.trim())
      if (parts.length < 4) { setError(`Linha inválida: "${line}"`); return }
      const [ticker, assetType, qtyStr, priceStr] = parts
      const quantity = parseFloat(qtyStr)
      const averagePrice = parseFloat(priceStr)
      if (!ticker || !assetType || isNaN(quantity) || isNaN(averagePrice)) {
        setError(`Dados inválidos na linha: "${line}"`); return
      }
      rows.push({ ticker: ticker.toUpperCase(), assetType: assetType.toUpperCase(), quantity, averagePrice })
    }

    if (rows.length === 0) { setError("Nenhuma linha válida encontrada."); return }

    setLoading(true)
    try {
      const res = await importPositions(portfolioId, rows)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setCsv("")
    setResult(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Posições via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Formato: <code className="bg-muted px-1 rounded">TICKER,TIPO,QUANTIDADE,PRECO_MEDIO</code></p>
            <p>Tipos: <code className="bg-muted px-1 rounded">STOCK</code> <code className="bg-muted px-1 rounded">FII</code> <code className="bg-muted px-1 rounded">ETF</code> <code className="bg-muted px-1 rounded">CRYPTO</code> <code className="bg-muted px-1 rounded">FIXED_INCOME</code> <code className="bg-muted px-1 rounded">OTHER</code></p>
            <p className="text-xs">Para FIXED_INCOME e OTHER: use quantidade=1 e preço=valor atual</p>
          </div>
          <Textarea
            placeholder={EXAMPLE}
            value={csv}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsv(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Importado: {result.created} novos, {result.updated} atualizados
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleImport} disabled={loading || !csv.trim()}>
              {loading ? "Importando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
