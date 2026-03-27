"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VariationBadge } from "@/components/ui/variation-badge"
import { formatCurrency, formatCompact } from "@/lib/utils"
import type { BrapiQuote } from "@/lib/brapi"
import Link from "next/link"
import Image from "next/image"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props { quotes: BrapiQuote[] }

const DEFAULT_FILTERS = {
  search: "",
  plMax: "",
  plMin: "",
  pvpMax: "",
  dyMin: "",
  marketCapMin: "",
}

type SortKey = "symbol" | "regularMarketPrice" | "regularMarketChangePercent" | "priceEarnings" | "priceToBook" | "dividendsYield" | "marketCap"

export function ScreenerClient({ quotes }: Props) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filters.search && !q.symbol.includes(filters.search.toUpperCase()) &&
          !q.shortName?.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.plMin && (q.priceEarnings == null || q.priceEarnings < parseFloat(filters.plMin))) return false
      if (filters.plMax && (q.priceEarnings == null || q.priceEarnings > parseFloat(filters.plMax))) return false
      if (filters.pvpMax && (q.priceToBook == null || q.priceToBook > parseFloat(filters.pvpMax))) return false
      if (filters.dyMin && (q.dividendsYield == null || q.dividendsYield * 100 < parseFloat(filters.dyMin))) return false
      if (filters.marketCapMin && (q.marketCap == null || q.marketCap < parseFloat(filters.marketCapMin) * 1e9)) return false
      return true
    }).sort((a, b) => {
      const av = (a[sortKey] as number) ?? (sortDir === "desc" ? -Infinity : Infinity)
      const bv = (b[sortKey] as number) ?? (sortDir === "desc" ? -Infinity : Infinity)
      return sortDir === "desc" ? bv - av : av - bv
    })
  }, [quotes, filters, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-muted-foreground/40 ml-0.5">↕</span>
    return <span className="text-primary ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>
  }

  const hasFilters = Object.values(filters).some(v => v !== "")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Screener de Ações</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} de {quotes.length} ativos</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros {hasFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary inline-block" />}
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar ticker ou empresa..."
        value={filters.search}
        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        className="max-w-sm"
      />

      {/* Advanced filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">P/L mínimo</Label>
                <Input placeholder="ex: 5" value={filters.plMin}
                  onChange={e => setFilters(f => ({ ...f, plMin: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">P/L máximo</Label>
                <Input placeholder="ex: 15" value={filters.plMax}
                  onChange={e => setFilters(f => ({ ...f, plMax: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">P/VP máximo</Label>
                <Input placeholder="ex: 1.5" value={filters.pvpMax}
                  onChange={e => setFilters(f => ({ ...f, pvpMax: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">DY mínimo (%)</Label>
                <Input placeholder="ex: 6" value={filters.dyMin}
                  onChange={e => setFilters(f => ({ ...f, dyMin: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Market Cap mín (B)</Label>
                <Input placeholder="ex: 10" value={filters.marketCapMin}
                  onChange={e => setFilters(f => ({ ...f, marketCapMin: e.target.value }))} className="mt-1" />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFilters(DEFAULT_FILTERS)}>
                <X className="h-3 w-3 mr-1" /> Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("symbol")}>
                  Ativo <SortIcon k="symbol" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("regularMarketPrice")}>
                  Preço <SortIcon k="regularMarketPrice" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("regularMarketChangePercent")}>
                  Var. D <SortIcon k="regularMarketChangePercent" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden sm:table-cell" onClick={() => toggleSort("priceEarnings")}>
                  P/L <SortIcon k="priceEarnings" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("priceToBook")}>
                  P/VP <SortIcon k="priceToBook" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("dividendsYield")}>
                  DY <SortIcon k="dividendsYield" />
                </th>
                <th className="text-right p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("marketCap")}>
                  Mkt Cap <SortIcon k="marketCap" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum ativo encontrado com estes filtros</td></tr>
              ) : filtered.map((q) => (
                <tr key={q.symbol} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <Link href={`/acoes/${q.symbol}`} className="flex items-center gap-2 hover:text-primary">
                      {q.logourl && (
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0">
                          <Image src={q.logourl} alt={q.symbol} width={28} height={28} className="object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-xs">{q.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">{q.shortName}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-right tabular-nums font-medium">{formatCurrency(q.regularMarketPrice)}</td>
                  <td className="p-3 text-right">
                    <VariationBadge value={q.regularMarketChangePercent} size="sm" />
                  </td>
                  <td className="p-3 text-right tabular-nums hidden sm:table-cell">
                    {q.priceEarnings && q.priceEarnings > 0 ? q.priceEarnings.toFixed(1) : "—"}
                  </td>
                  <td className="p-3 text-right tabular-nums hidden md:table-cell">
                    {q.priceToBook ? q.priceToBook.toFixed(2) : "—"}
                  </td>
                  <td className="p-3 text-right tabular-nums hidden md:table-cell text-emerald-500">
                    {q.dividendsYield ? `${(q.dividendsYield * 100).toFixed(2)}%` : "—"}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                    {q.marketCap ? formatCompact(q.marketCap) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
