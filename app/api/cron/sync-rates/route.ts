import { NextRequest, NextResponse } from "next/server"
import { fetchAllRates } from "@/lib/bcb"
import { prisma } from "@/lib/prisma"

function parseBCBDate(dateStr: string): Date {
  // BCB returns dates in DD/MM/YYYY format
  const [day, month, year] = dateStr.split("/")
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  date.setHours(0, 0, 0, 0)
  return date
}

function formatBCBDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

async function backfillCDIHistory(fromDate: Date, toDate: Date) {
  try {
    // BCB date-range API — no record limit, unlike /ultimos/N
    const from = formatBCBDate(fromDate)
    const to = formatBCBDate(toDate)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?dataInicial=${from}&dataFinal=${to}&formato=json`

    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return { error: `BCB API ${res.status}`, url }

    const data: { data: string; valor: string }[] = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      return { error: "No data from BCB", url }
    }

    let upserted = 0
    for (const record of data) {
      const date = parseBCBDate(record.data)
      const value = parseFloat(record.valor)
      await prisma.economicRate.upsert({
        where: { name_date: { name: "CDI", date } },
        update: { value },
        create: { name: "CDI", date, value, source: "BCB" },
      })
      upserted++
    }

    return { upserted, from, to }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const shouldBackfill = req.nextUrl.searchParams.get("backfill") === "true"

  if (shouldBackfill) {
    const fromParam = req.nextUrl.searchParams.get("from")
    const toParam = req.nextUrl.searchParams.get("to")
    const fromDate = fromParam ? new Date(fromParam) : new Date("2025-10-01")
    const toDate = toParam ? new Date(toParam) : new Date()
    const result = await backfillCDIHistory(fromDate, toDate)
    return NextResponse.json({ backfill: result })
  }

  const rates = await fetchAllRates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const entries = [
    { name: "CDI", value: rates.cdi, source: "BCB" },
    { name: "SELIC", value: rates.selic, source: "BCB" },
    { name: "IPCA", value: rates.ipca, source: "BCB" },
    { name: "IGPM", value: rates.igpm, source: "BCB" },
  ].filter((e) => e.value > 0)

  await Promise.allSettled(
    entries.map((e) =>
      prisma.economicRate.upsert({
        where: { name_date: { name: e.name, date: today } },
        update: { value: e.value },
        create: { name: e.name, value: e.value, date: today, source: e.source },
      })
    )
  )

  return NextResponse.json({ ok: true, synced: entries.length, rates })
}
