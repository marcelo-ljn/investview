import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyTransactionToPosition } from "@/lib/portfolio-position"

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

  // 3. Replay each BUY/SELL using the shared position logic
  for (const tx of transactions) {
    await applyTransactionToPosition(id, tx)
  }

  const positions = await prisma.position.findMany({ where: { portfolioId: id } })

  return NextResponse.json({
    message: "Positions rebuilt from transaction history",
    transactionsReplayed: transactions.filter(t => t.type === "BUY" || t.type === "SELL").length,
    positionsRebuilt: positions.length,
    positions: positions.map(p => ({
      ticker: p.ticker,
      assetType: p.assetType,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
    })),
  })
}
