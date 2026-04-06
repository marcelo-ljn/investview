import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applyTransactionToPosition } from "@/lib/portfolio-position"
import { z } from "zod"

const INDEXER_VALUES = ["CDI", "SELIC", "IPCA", "IGPM", "PREFIXADO", "IPCA_PLUS", "CDI_PLUS"] as const

const transactionSchema = z.object({
  ticker: z.string().min(1).max(200).transform(v => v.trim()),
  assetType: z.enum(["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO", "FIXED_INCOME", "OTHER"]),
  type: z.enum(["BUY", "SELL", "DIVIDEND", "JCP", "AMORTIZATION", "SUBSCRIPTION"]),
  date: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().min(0).default(0),
  costOverride: z.number().positive().optional(),
  indexer: z.enum(INDEXER_VALUES).optional(),
  rate: z.number().positive().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const transactions = await prisma.transaction.findMany({
    where: { portfolioId: id },
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ transactions })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = transactionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data

  const transaction = await prisma.transaction.create({
    data: {
      portfolioId: id,
      ticker: data.ticker,
      assetType: data.assetType,
      type: data.type,
      date: new Date(data.date),
      quantity: data.quantity,
      price: data.price,
      fees: data.fees,
      costOverride: data.costOverride,
      indexer: data.indexer,
      rate: data.rate,
      notes: data.notes,
    },
  })

  // Update position
  await applyTransactionToPosition(id, data)

  return NextResponse.json({ transaction }, { status: 201 })
}
