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

const POSITIONS_EXAMPLE = `PETR4,STOCK,100,37.50
MXRF11,FII,200,10.20
CDB Mercado Pago 110% CDI,FIXED_INCOME,1,100000
Emprestimo Pessoal,OTHER,1,40000`

const TX_EXAMPLE = `# Cols 8-10 opcionais: custo_original, indexador, taxa
CDB Mercado Pago 110% CDI,FIXED_INCOME,BUY,2025-11-07,1,107500,0,100000,CDI,110
LCI LIG Inter 87% CDI,FIXED_INCOME,BUY,2025-11-24,1,132263,0,,CDI,87
Emprestimo Pessoal 48x,OTHER,BUY,2026-02-02,1,40825.12,0,40000,PREFIXADO,24.5
PETR4,STOCK,BUY,2025-01-15,100,32.50,5.00
PETR4,STOCK,SELL,2025-06-01,50,42.00,5.00`

export function ImportCsvDialog({ portfolioId }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"positions" | "transactions">("transactions")
  const [csv, setCsv] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImportPositions() {
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
      rows.push({ ticker: ticker.trim(), assetType: assetType.toUpperCase(), quantity, averagePrice })
    }

    if (rows.length === 0) { setError("Nenhuma linha válida encontrada."); return }

    setLoading(true)
    try {
      const res = await importPositions(portfolioId, rows)
      setResult(`${res.created} posições criadas, ${res.updated} atualizadas`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao importar")
    } finally {
      setLoading(false)
    }
  }

  async function handleImportTransactions() {
    setError(null)
    const lines = csv.trim().split("\n").filter(l => l.trim() && !l.trim().startsWith("#"))
    const transactions: object[] = []

    for (const line of lines) {
      const parts = line.split(",").map(s => s.trim())
      if (parts.length < 6) { setError(`Linha inválida (precisa de 6+ colunas): "${line}"`); return }
      const [ticker, assetType, type, date, qtyStr, priceStr, feesStr, costOverrideStr, indexerStr, rateStr] = parts
      const quantity = parseFloat(qtyStr)
      const price = parseFloat(priceStr)
      const fees = parseFloat(feesStr ?? "0") || 0
      const costOverride = costOverrideStr ? parseFloat(costOverrideStr) : undefined
      const indexerVal = indexerStr ? indexerStr.trim().toUpperCase() : undefined
      const rateVal = rateStr ? parseFloat(rateStr.trim()) : undefined

      if (!ticker || !assetType || !type || !date || isNaN(quantity) || isNaN(price)) {
        setError(`Dados inválidos na linha: "${line}"`); return
      }

      const validTypes = ["BUY", "SELL", "DIVIDEND", "JCP", "AMORTIZATION", "SUBSCRIPTION"]
      if (!validTypes.includes(type.toUpperCase())) {
        setError(`Tipo de operação inválido "${type}". Use: ${validTypes.join(", ")}`); return
      }

      const validIndexers = ["CDI", "SELIC", "IPCA", "IGPM", "PREFIXADO", "IPCA_PLUS", "CDI_PLUS"]
      if (indexerVal && !validIndexers.includes(indexerVal)) {
        setError(`Indexador inválido "${indexerStr}". Use: ${validIndexers.join(", ")}`); return
      }

      transactions.push({
        ticker: ticker.trim(),
        assetType: assetType.toUpperCase(),
        type: type.toUpperCase(),
        date,
        quantity,
        price,
        fees,
        ...(costOverride !== undefined && !isNaN(costOverride) ? { costOverride } : {}),
        ...(indexerVal ? { indexer: indexerVal } : {}),
        ...(rateVal !== undefined && !isNaN(rateVal) ? { rate: rateVal } : {}),
      })
    }

    if (transactions.length === 0) { setError("Nenhuma transação válida encontrada."); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/portfolio/${portfolioId}/transactions/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, rebuildPositions: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(JSON.stringify(data.error))
        return
      }
      setResult(`${data.inserted} transações importadas. Posições reconstruídas: ${data.positions} ativo(s).`)
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

  function handleImport() {
    if (mode === "positions") return handleImportPositions()
    return handleImportTransactions()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar via CSV</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mt-2">
          <button
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === "transactions" ? "bg-card shadow font-medium" : "text-muted-foreground"}`}
            onClick={() => { setMode("transactions"); setCsv(""); setResult(null); setError(null) }}
          >
            Histórico de transações ★
          </button>
          <button
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === "positions" ? "bg-card shadow font-medium" : "text-muted-foreground"}`}
            onClick={() => { setMode("positions"); setCsv(""); setResult(null); setError(null) }}
          >
            Posições atuais
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {mode === "transactions" ? (
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground">Formato:</p>
              <code className="block">TICKER, TIPO, OP, DATA, QTDE, PREÇO, TAXAS[, CUSTO_ORIG[, INDEXADOR[, TAXA]]]</code>
              <p className="mt-1">Tipos: <code>STOCK FII ETF CRYPTO FIXED_INCOME OTHER</code></p>
              <p>Operações: <code>BUY SELL DIVIDEND JCP</code> · Data: <code>AAAA-MM-DD</code></p>
              <p>Indexadores: <code>CDI SELIC IPCA IPCA_PLUS CDI_PLUS IGPM PREFIXADO</code></p>
              <p>Taxa: % do índice (CDI/SELIC), spread a.a. (IPCA+/CDI+) ou taxa a.a. (PREFIXADO)</p>
              <p className="text-amber-400">⚡ Importar transações recalcula suas posições automaticamente do zero.</p>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p className="font-medium text-foreground">Formato:</p>
              <code className="block">TICKER, TIPO_ATIVO, QUANTIDADE, PREÇO_MÉDIO</code>
              <p>Para Renda Fixa/Outros: use quantidade=1 e preço=valor atual</p>
            </div>
          )}

          <Textarea
            placeholder={mode === "transactions" ? TX_EXAMPLE : POSITIONS_EXAMPLE}
            value={csv}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsv(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleImport} disabled={loading || !csv.trim()}>
              {loading ? "Importando..." : `Importar ${mode === "transactions" ? "transações" : "posições"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
