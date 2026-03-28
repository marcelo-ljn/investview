import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({ where: { id, userId: session.user.id } })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 1. Delete all current positions
  await prisma.position.deleteMany({ where: { portfolioId: id } })

  // 2. Fetch all transactions ordered chronologically
  const transactions = await prisma.transaction.findMany({
    where: { portfolioId: id },
    orderBy: { date: "asc" },
  })

  // 3. Replay each BUY/SELL to rebuild positions
  for (const tx of transactions) {
    if (tx.type !== "BUY" && tx.type !== "SELL") continue

    const existing = await prisma.position.findFirst({
      where: { portfolioId: id, ticker: tx.ticker },
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
          data: {
            portfolioId: id,
            ticker: tx.ticker,
            assetType: tx.assetType,
            quantity: tx.quantity,
            averagePrice: tx.price,
          },
        })
      }
    } else if (tx.type === "SELL" && existing) {
      const newQty = existing.quantity - tx.quantity
      if (newQty <= 0.0001) {
        await prisma.position.delete({ where: { id: existing.id } })
      } else {
        await prisma.position.update({
          where: { id: existing.id },
          data: { quantity: newQty },
        })
      }
    }
  }

  const positions = await prisma.position.findMany({ where: { portfolioId: id } })

  return NextResponse.json({
    message: "Positions rebuilt from transaction history",
    transactionsReplayed: transactions.filter(t => t.type === "BUY" || t.type === "SELL").length,
    positionsRebult: positions.length,
    positions: positions.map(p => ({
      ticker: p.ticker,
      assetType: p.assetType,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
    })),
  })
}
