import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyTransactionToPosition } from "@/lib/portfolio-position"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, txId } = await params

  const portfolio = await prisma.portfolio.findFirst({ where: { id, userId: session.user.id } })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const tx = await prisma.transaction.findFirst({ where: { id: txId, portfolioId: id } })
  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

  // Delete the transaction
  await prisma.transaction.delete({ where: { id: txId } })

  // Rebuild all positions from scratch to keep consistency
  await prisma.position.deleteMany({ where: { portfolioId: id } })
  const allTx = await prisma.transaction.findMany({
    where: { portfolioId: id },
    orderBy: { date: "asc" },
  })
  for (const t of allTx) {
    await applyTransactionToPosition(id, t)
  }

  return NextResponse.json({ ok: true })
}
