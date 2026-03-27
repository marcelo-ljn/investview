// ─── Stock ───────────────────────────────────────────────────────────────────

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;       // variação $
  changePercent: number; // variação %
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap?: number;
  logoUrl?: string;
  sector?: string;
  updatedAt: string;
}

export interface StockFundamentals {
  ticker: string;
  pl?: number;
  pvp?: number;
  roe?: number;
  roic?: number;
  dyTtm?: number;
  evEbitda?: number;
  ebitda?: number;
  lucroLiquido?: number;
  dividaLiquida?: number;
  dividaEbitda?: number;
  mrLucro?: number;
  mrEbit?: number;
  lpa?: number;
  vpa?: number;
}

export interface Dividend {
  type: string;
  value: number;
  exDate: string;
  payDate?: string;
}

export interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── FII ──────────────────────────────────────────────────────────────────────

export interface FIIQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  pvp?: number;
  dyMes?: number;
  dy12M?: number;
  vacancia?: number;
  segment?: string;
  fiiType?: string;
  logoUrl?: string;
}

// ─── Renda Fixa ───────────────────────────────────────────────────────────────

export interface TreasuryBond {
  name: string;
  type: "SELIC" | "IPCA" | "PREFIXADO" | "IPCA_JUROS" | "PREFIXADO_JUROS";
  expiryDate: string;
  buyRate: number;
  sellRate: number;
  buyPrice: number;
  sellPrice: number;
  minAmount: number;
}

export interface EconomicRates {
  cdi: number;
  selic: number;
  ipca: number;
  igpm?: number;
  updatedAt: string;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  monthDividends: number;
  yearDividends: number;
}

export interface PositionWithQuote {
  ticker: string;
  assetType: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  weight: number; // % do portfolio
  logoUrl?: string;
  name?: string;
}

// ─── Charts ───────────────────────────────────────────────────────────────────

export type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}
