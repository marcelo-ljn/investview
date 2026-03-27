import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://investview.vercel.app"

const STOCK_TICKERS = [
  "PETR4","VALE3","ITUB4","BBDC4","WEGE3","RENT3","ABEV3","B3SA3",
  "MGLU3","LREN3","JBSS3","EGIE3","PRIO3","HAPV3","TAEE11","VIVT3"
]

const FII_TICKERS = [
  "HGLG11","XPML11","KNRI11","BRCO11","VISC11","HSML11","MXRF11","CPTS11"
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${BASE_URL}/acoes`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${BASE_URL}/fiis`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${BASE_URL}/renda-fixa`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${BASE_URL}/etfs`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE_URL}/cripto`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${BASE_URL}/simulador`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/comparador`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
  ]

  const stockRoutes = STOCK_TICKERS.map((ticker) => ({
    url: `${BASE_URL}/acoes/${ticker}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }))

  const fiiRoutes = FII_TICKERS.map((ticker) => ({
    url: `${BASE_URL}/fiis/${ticker}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...stockRoutes, ...fiiRoutes]
}
