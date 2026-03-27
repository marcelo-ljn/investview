/**
 * brapi.dev — API de cotações brasileiras (e US stocks)
 * Docs: https://brapi.dev/docs
 */

const BRAPI_BASE = "https://brapi.dev/api";
const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

function headers() {
  return BRAPI_TOKEN
    ? { Authorization: `Bearer ${BRAPI_TOKEN}` }
    : ({} as Record<string, string>);
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export interface BrapiQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  regularMarketVolume: number;
  marketCap?: number;
  logourl?: string;
  sector?: string;
  industry?: string;
  // Fundamentus
  priceEarnings?: number;
  earningsPerShare?: number;
  priceToBook?: number;
  dividendsYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export async function fetchQuote(ticker: string): Promise<BrapiQuote | null> {
  try {
    const res = await fetch(
      `${BRAPI_BASE}/quote/${ticker}?fundamental=true&logourl=true`,
      {
        headers: headers(),
        next: { revalidate: 300 }, // 5 min cache
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchMultipleQuotes(
  tickers: string[]
): Promise<BrapiQuote[]> {
  if (tickers.length === 0) return [];
  try {
    const res = await fetch(
      `${BRAPI_BASE}/quote/${tickers.join(",")}?fundamental=true&logourl=true`,
      {
        headers: headers(),
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

// ─── Historical ───────────────────────────────────────────────────────────────

export type BrapiRange =
  | "1d"
  | "5d"
  | "1mo"
  | "3mo"
  | "6mo"
  | "1y"
  | "2y"
  | "5y"
  | "10y"
  | "ytd"
  | "max";

export type BrapiInterval =
  | "1m"
  | "2m"
  | "5m"
  | "15m"
  | "30m"
  | "60m"
  | "90m"
  | "1h"
  | "1d"
  | "5d"
  | "1wk"
  | "1mo"
  | "3mo";

export interface BrapiHistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistory(
  ticker: string,
  range: BrapiRange = "1y",
  interval: BrapiInterval = "1d"
): Promise<BrapiHistoricalPoint[]> {
  try {
    const res = await fetch(
      `${BRAPI_BASE}/quote/${ticker}?range=${range}&interval=${interval}`,
      {
        headers: headers(),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const prices = data.results?.[0]?.historicalDataPrice ?? [];
    return prices.map(
      (p: { date: number; open: number; high: number; low: number; close: number; volume: number }) => ({
        date: new Date(p.date * 1000).toISOString().split("T")[0],
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      })
    );
  } catch {
    return [];
  }
}

// ─── Dividends ────────────────────────────────────────────────────────────────

export interface BrapiDividend {
  earningsDate?: string;
  value?: number;
  rate?: number;
  paymentDate?: string;
  declaredDate?: string;
  type?: string;
}

export async function fetchDividends(
  ticker: string
): Promise<BrapiDividend[]> {
  try {
    const res = await fetch(
      `${BRAPI_BASE}/quote/${ticker}?dividends=true`,
      {
        headers: headers(),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results?.[0]?.dividendsData?.cashDividends ?? [];
  } catch {
    return [];
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function fetchTickerList(type: "stock" | "fii" | "etf" = "stock") {
  try {
    const res = await fetch(`${BRAPI_BASE}/quote/list?type=${type}`, {
      headers: headers(),
      next: { revalidate: 86400 }, // 24h
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.stocks ?? [];
  } catch {
    return [];
  }
}
