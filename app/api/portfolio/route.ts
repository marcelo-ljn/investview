import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: {
      positions: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ portfolios })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, color } = body

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // If first portfolio, set as default
  const count = await prisma.portfolio.count({ where: { userId: session.user.id } })

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: session.user.id,
      name,
      color: color ?? "#3B82F6",
      isDefault: count === 0,
    },
  })

  return NextResponse.json({ portfolio }, { status: 201 })
}
