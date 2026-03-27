import { NextRequest, NextResponse } from "next/server"
import { fetchAllRates } from "@/lib/bcb"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
