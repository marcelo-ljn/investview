import { NextRequest, NextResponse } from "next/server"
import { fetchTesouroBonds } from "@/lib/tesouro"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bonds = await fetchTesouroBonds()
  if (bonds.length === 0) {
    return NextResponse.json({ ok: false, message: "No bonds fetched" })
  }

  await Promise.allSettled(
    bonds.map((b) =>
      prisma.treasuryBond.upsert({
        where: { code: b.code },
        update: {
          buyRate: b.buyRate,
          sellRate: b.sellRate,
          buyPrice: b.buyPrice,
          sellPrice: b.sellPrice,
          updatedAt: new Date(),
          isActive: true,
        },
        create: {
          name: b.name,
          code: b.code,
          type: b.type,
          expiryDate: new Date(b.expiryDate),
          buyRate: b.buyRate,
          sellRate: b.sellRate,
          buyPrice: b.buyPrice,
          sellPrice: b.sellPrice,
          minAmount: b.minAmount,
          updatedAt: new Date(),
        },
      })
    )
  )

  return NextResponse.json({ ok: true, synced: bonds.length })
}
