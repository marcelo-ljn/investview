import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const txSchema = z.object({
  ticker: z.string().min(1).max(200).transform(v => v.trim()),
  assetType: z.enum(["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO", "FIXED_INCOME", "OTHER"]),
  type: z.enum(["BUY", "SELL", "DIVIDEND", "JCP", "AMORTIZATION", "SUBSCRIPTION"]),
  date: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().min(0).default(0),
  notes: z.string().optional(),
})

const batchSchema = z.object({
  transactions: z.array(txSchema).min(1).max(500),
  rebuildPositions: z.boolean().default(true),
})

// Helper: recalc position from a single transaction (same logic as single POST)
async function applyTransaction(
  portfolioId: string,
  tx: z.infer<typeof txSchema>
) {
  if (tx.type !== "BUY" && tx.type !== "SELL") return

  const ticker = tx.ticker
  const existing = await prisma.position.findFirst({
    where: { portfolioId, ticker },
  })

  if (tx.type === "BUY") {
    if (existing) {
      const newQty = existing.quantity + tx.quantity
      const newAvg = (existing.quantity * existing.averagePrice + tx.quantity * tx.price) / newQty
      await prisma.position.update({
        where: { id: existing.id },
        data: { quantity: newQty, averagePrice: newAvg },
      })
    } else {
      await prisma.position.create({
        data: { portfolioId, ticker, assetType: tx.assetType, quantity: tx.quantity, averagePrice: tx.price },
      })
    }
  } else if (tx.type === "SELL" && existing) {
    const newQty = existing.quantity - tx.quantity
    if (newQty <= 0.0001) {
      await prisma.position.delete({ where: { id: existing.id } })
    } else {
      await prisma.position.update({ where: { id: existing.id }, data: { quantity: newQty } })
    }
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({ where: { id, userId: session.user.id } })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = batchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { transactions, rebuildPositions } = parsed.data

  // Sort by date ascending so positions are built correctly
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // If rebuilding: delete existing positions first, then replay ALL transactions from DB + new ones
  if (rebuildPositions) {
    await prisma.position.deleteMany({ where: { portfolioId: id } })
  }

  // Insert all transactions in bulk
  await prisma.transaction.createMany({
    data: sorted.map(tx => ({
      portfolioId: id,
      ticker: tx.ticker,
      assetType: tx.assetType,
      type: tx.type,
      date: new Date(tx.date),
      quantity: tx.quantity,
      price: tx.price,
      fees: tx.fees,
      notes: tx.notes,
    })),
    skipDuplicates: false,
  })

  if (rebuildPositions) {
    // Replay ALL historical transactions in order (including newly inserted)
    const allTx = await prisma.transaction.findMany({
      where: { portfolioId: id },
      orderBy: { date: "asc" },
    })
    for (const tx of allTx) {
      await applyTransaction(id, {
        ticker: tx.ticker,
        assetType: tx.assetType as z.infer<typeof txSchema>["assetType"],
        type: tx.type as z.infer<typeof txSchema>["type"],
        date: tx.date.toISOString(),
        quantity: tx.quantity,
        price: tx.price,
        fees: tx.fees,
        notes: tx.notes ?? undefined,
      })
    }
  } else {
    // Just apply the new transactions sequentially
    for (const tx of sorted) {
      await applyTransaction(id, tx)
    }
  }

  const positionCount = await prisma.position.count({ where: { portfolioId: id } })

  return NextResponse.json({
    inserted: sorted.length,
    positions: positionCount,
  }, { status: 201 })
}
