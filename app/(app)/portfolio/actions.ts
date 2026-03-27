"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AssetType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function updatePortfolioNotes(portfolioId: string, notes: string, goalValue: number | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId: session.user.id },
  })
  if (!portfolio) throw new Error("Portfolio not found")

  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { notes: notes || null, goalValue: goalValue || null },
  })
  revalidatePath("/portfolio")
}

export async function importPositions(portfolioId: string, rows: { ticker: string; assetType: string; quantity: number; averagePrice: number }[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId: session.user.id },
  })
  if (!portfolio) throw new Error("Portfolio not found")

  // Upsert each position
  let created = 0
  let updated = 0
  for (const row of rows) {
    const existing = await prisma.position.findFirst({
      where: { portfolioId, ticker: row.ticker },
    })
    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: { quantity: row.quantity, averagePrice: row.averagePrice },
      })
      updated++
    } else {
      await prisma.position.create({
        data: { portfolioId, ticker: row.ticker, assetType: row.assetType as AssetType, quantity: row.quantity, averagePrice: row.averagePrice },
      })
      created++
    }
  }
  revalidatePath("/portfolio")
  return { created, updated }
}
