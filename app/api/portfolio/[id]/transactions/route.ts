import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const transactionSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  assetType: z.enum(["STOCK", "FII", "ETF", "US_STOCK", "CRYPTO", "FIXED_INCOME"]),
  type: z.enum(["BUY", "SELL", "DIVIDEND", "JCP", "AMORTIZATION", "SUBSCRIPTION"]),
  date: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fees: z.number().min(0).default(0),
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
      notes: data.notes,
    },
  })

  // Update position
  if (data.type === "BUY" || data.type === "SELL") {
    const existing = await prisma.position.findUnique({
      where: { portfolioId_ticker: { portfolioId: id, ticker: data.ticker } },
    })

    if (data.type === "BUY") {
      if (existing) {
        const newQty = existing.quantity + data.quantity
        const newAvg = (existing.quantity * existing.averagePrice + data.quantity * data.price) / newQty
        await prisma.position.update({
          where: { portfolioId_ticker: { portfolioId: id, ticker: data.ticker } },
          data: { quantity: newQty, averagePrice: newAvg },
        })
      } else {
        await prisma.position.create({
          data: {
            portfolioId: id,
            ticker: data.ticker,
            assetType: data.assetType,
            quantity: data.quantity,
            averagePrice: data.price,
          },
        })
      }
    } else if (data.type === "SELL" && existing) {
      const newQty = existing.quantity - data.quantity
      if (newQty <= 0) {
        await prisma.position.delete({
          where: { portfolioId_ticker: { portfolioId: id, ticker: data.ticker } },
        })
      } else {
        await prisma.position.update({
          where: { portfolioId_ticker: { portfolioId: id, ticker: data.ticker } },
          data: { quantity: newQty },
        })
      }
    }
  }

  return NextResponse.json({ transaction }, { status: 201 })
}
