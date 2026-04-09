import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyTransactionToPosition } from "@/lib/portfolio-position"
import { z } from "zod"

const INDEXER_VALUES = ["CDI", "SELIC", "IPCA", "IGPM", "PREFIXADO", "IPCA_PLUS", "CDI_PLUS"] as const

const updateSchema = z.object({
  ticker: z.string().min(1).max(200).transform(v => v.trim()).optional(),
  assetType: z.enum(["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO", "FIXED_INCOME", "OTHER"]).optional(),
  type: z.enum(["BUY", "SELL", "DIVIDEND", "JCP", "AMORTIZATION", "SUBSCRIPTION"]).optional(),
  date: z.string().optional(),
  quantity: z.number().positive().optional(),
  price: z.number().positive().optional(),
  fees: z.number().min(0).optional(),
  indexer: z.enum(INDEXER_VALUES).nullable().optional(),
  rate: z.number().positive().nullable().optional(),
  maturityDate: z.string().nullable().optional(),
  notes: z.string().optional(),
})

async function rebuildPositions(portfolioId: string) {
  await prisma.position.deleteMany({ where: { portfolioId } })
  const allTx = await prisma.transaction.findMany({
    where: { portfolioId },
    orderBy: { date: "asc" },
  })
  for (const t of allTx) {
    await applyTransactionToPosition(portfolioId, t)
  }
}

export async function PATCH(
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

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data
  await prisma.transaction.update({
    where: { id: txId },
    data: {
      ...(data.ticker && { ticker: data.ticker }),
      ...(data.assetType && { assetType: data.assetType }),
      ...(data.type && { type: data.type }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.fees !== undefined && { fees: data.fees }),
      ...(data.indexer !== undefined && { indexer: data.indexer }),
      ...(data.rate !== undefined && { rate: data.rate }),
      ...(data.maturityDate !== undefined && { maturityDate: data.maturityDate ? new Date(data.maturityDate) : null }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })

  await rebuildPositions(id)
  return NextResponse.json({ ok: true })
}

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

  await prisma.transaction.delete({ where: { id: txId } })
  await rebuildPositions(id)

  return NextResponse.json({ ok: true })
}
