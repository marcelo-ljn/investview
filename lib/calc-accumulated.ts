import { Indexer } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * BCB serie 11 stores the DAILY CDI rate as % per business day
 * e.g., 0.055131 means 0.055131% per day ≈ 14.9% per year (252 days)
 *
 * For CDI at rate% (e.g. 110):
 *   each day: value *= (1 + 0.055131 * 1.10 / 100)
 *
 * For CDI_PLUS at spread% a.a. (e.g. 2.0):
 *   annualize base CDI → add spread → convert back to daily
 *
 * For PREFIXADO at rate% a.a. (e.g. 14.5):
 *   each day: value *= (1 + 14.5/100 / 252)  — 252 business days/year convention
 */
export async function calcAccumulatedValue(
  principal: number,
  investedAt: Date,
  indexer: Indexer | null,
  rate: number | null,
  maturityDate?: Date | null,
): Promise<number> {
  if (!indexer || rate == null) return principal

  // Cap calculation at maturity date if it's in the past
  const endDate = maturityDate && maturityDate < new Date() ? maturityDate : new Date()

  // PREFIXADO: simple compound using business-day convention (252/year)
  if (indexer === "PREFIXADO") {
    const dailyRates = await prisma.economicRate.findMany({
      where: { name: "CDI", date: { gte: investedAt, lte: endDate } },
      orderBy: { date: "asc" },
    })
    const numDays = dailyRates.length > 0 ? dailyRates.length : Math.floor(
      (endDate.getTime() - investedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const dailyFactor = rate / 100 / 252
    return principal * Math.pow(1 + dailyFactor, numDays)
  }

  const rateType = indexer === "SELIC" ? "SELIC" : "CDI"
  const dailyRates = await prisma.economicRate.findMany({
    where: { name: rateType, date: { gte: investedAt, lte: endDate } },
    orderBy: { date: "asc" },
  })

  if (dailyRates.length === 0) return principal

  let value = principal

  for (const record of dailyRates) {
    // record.value = daily CDI rate as % (e.g., 0.055131)
    const dailyEffectivePct = getDailyEffectivePct(indexer, rate, record.value)
    value = value * (1 + dailyEffectivePct / 100)
  }

  return value
}

/**
 * Returns the DAILY effective rate as a percentage (e.g., 0.060644 for CDI 110%).
 * @param indexerValue - daily CDI/SELIC rate in % per day (from EconomicRate table)
 */
function getDailyEffectivePct(indexer: Indexer, rate: number, indexerValue: number): number {
  switch (indexer) {
    case "CDI":
    case "SELIC":
      // CDI 110% → effective daily = dailyCDI × 1.10
      return indexerValue * (rate / 100)

    case "CDI_PLUS": {
      // Annualize the base CDI, add spread, convert back to daily
      // annualCDI = (1 + dailyCDI/100)^252 - 1
      const annualBase = Math.pow(1 + indexerValue / 100, 252) - 1
      const annualEffective = annualBase + rate / 100
      // daily = (1 + annualEffective)^(1/252) - 1
      return (Math.pow(1 + annualEffective, 1 / 252) - 1) * 100
    }

    default:
      return indexerValue
  }
}

/**
 * Get the investment start date and maturity date for a position
 * by finding the first BUY transaction.
 */
export async function getInvestedAt(
  portfolioId: string,
  ticker: string
): Promise<Date | null> {
  const firstBuy = await prisma.transaction.findFirst({
    where: { portfolioId, ticker, type: "BUY" },
    orderBy: { date: "asc" },
  })
  return firstBuy?.date ?? null
}

export async function getMaturityDate(
  portfolioId: string,
  ticker: string
): Promise<Date | null> {
  const firstBuy = await prisma.transaction.findFirst({
    where: { portfolioId, ticker, type: "BUY" },
    orderBy: { date: "asc" },
  })
  return firstBuy?.maturityDate ?? null
}
