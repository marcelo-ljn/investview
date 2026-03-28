/**
 * Portfolio position calculation helpers.
 *
 * FIXED_INCOME / OTHER: value-based tracking
 *   - position.quantity  = total current BRL balance (e.g. R$ 60.000)
 *   - position.averagePrice = 1 (constant sentinel)
 *   - currentValue = quantity × 1 = balance  ✓
 *   - BUY  → quantity += transaction total value
 *   - SELL → quantity -= transaction total value; delete if ≤ 0
 *
 * STOCK / FII / ETF / US_STOCK / CRYPTO: quantity + average-price tracking
 *   - BUY  → weighted average price recalculation
 *   - SELL → reduce quantity; delete if ≤ 0
 */

import { prisma } from "@/lib/prisma"

const VALUE_BASED = ["FIXED_INCOME", "OTHER"]

interface TxInput {
  ticker: string
  assetType: string
  type: string
  quantity: number
  price: number
}

export async function applyTransactionToPosition(portfolioId: string, tx: TxInput) {
  if (tx.type !== "BUY" && tx.type !== "SELL") return

  if (VALUE_BASED.includes(tx.assetType)) {
    // Value-based: qty = total BRL balance, avgPrice = 1
    const amount = tx.quantity * tx.price
    const existing = await prisma.position.findFirst({ where: { portfolioId, ticker: tx.ticker } })

    if (tx.type === "BUY") {
      if (existing) {
        await prisma.position.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + amount },
        })
      } else {
        await prisma.position.create({
          data: {
            portfolioId,
            ticker: tx.ticker,
            assetType: tx.assetType as "FIXED_INCOME" | "OTHER",
            quantity: amount,
            averagePrice: 1,
          },
        })
      }
    } else {
      // SELL
      if (existing) {
        const newBalance = existing.quantity - amount
        if (newBalance <= 0.01) {
          await prisma.position.delete({ where: { id: existing.id } })
        } else {
          await prisma.position.update({ where: { id: existing.id }, data: { quantity: newBalance } })
        }
      }
    }
  } else {
    // Quantity-based: stocks, FIIs, ETFs, crypto
    const existing = await prisma.position.findFirst({ where: { portfolioId, ticker: tx.ticker } })

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
            portfolioId,
            ticker: tx.ticker,
            assetType: tx.assetType as "STOCK" | "FII" | "ETF" | "US_STOCK" | "CRYPTO",
            quantity: tx.quantity,
            averagePrice: tx.price,
          },
        })
      }
    } else {
      // SELL
      if (existing) {
        const newQty = existing.quantity - tx.quantity
        if (newQty <= 0.0001) {
          await prisma.position.delete({ where: { id: existing.id } })
        } else {
          await prisma.position.update({ where: { id: existing.id }, data: { quantity: newQty } })
        }
      }
    }
  }
}
