import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "BRL",
  locale = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function isPositive(value: number): boolean {
  return value > 0;
}

export function isNegative(value: number): boolean {
  return value < 0;
}

export function variationColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-zinc-400";
}

export function variationBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-500";
  if (value < 0) return "bg-red-500/10 text-red-500";
  return "bg-zinc-500/10 text-zinc-400";
}

// IR regressivo para renda fixa
export function calcIR(days: number): number {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

// Simula renda fixa com indexador
export function simulateFixedIncome({
  principal,
  monthlyContribution,
  annualRate, // % ao ano
  months,
  taxRate = 0.15,
}: {
  principal: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
  taxRate?: number;
}): { month: number; gross: number; net: number; contributed: number }[] {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  const results = [];
  let balance = principal;
  let totalContributed = principal;

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    totalContributed += monthlyContribution;
    const gain = balance - totalContributed;
    const tax = gain > 0 ? gain * taxRate : 0;
    results.push({
      month: m,
      gross: balance,
      net: balance - tax,
      contributed: totalContributed,
    });
  }

  return results;
}
