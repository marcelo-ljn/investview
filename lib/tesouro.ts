/**
 * Tesouro Direto — API pública oficial B3/Tesouro Nacional
 */

const TESOURO_URL =
  "https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/taxas.json";

export interface TesouroBond {
  name: string;
  code: string;
  type: string;
  expiryDate: string;
  buyRate: number;
  sellRate: number;
  buyPrice: number;
  sellPrice: number;
  minAmount: number;
}

interface RawBondData {
  NmTd?: string;
  VlTxCompra?: number;
  VlTxVenda?: number;
  VlPuCompra?: number;
  VlPuVenda?: number;
  VlInvMinimo?: number;
  DtVencimento?: string;
}

function mapType(name: string): string {
  if (name.includes("Selic")) return "SELIC";
  if (name.includes("IPCA") && name.includes("Juros")) return "IPCA_JUROS";
  if (name.includes("IPCA")) return "IPCA";
  if (name.includes("Prefixado") && name.includes("Juros")) return "PREFIXADO_JUROS";
  if (name.includes("Prefixado")) return "PREFIXADO";
  return "OUTRO";
}

export async function fetchTesouroBonds(): Promise<TesouroBond[]> {
  try {
    const res = await fetch(TESOURO_URL, {
      next: { revalidate: 900 }, // 15 min
    });
    if (!res.ok) return [];
    const data = await res.json();

    const bonds: TesouroBond[] = [];
    const items =
      data?.response?.TrsrBdTradgList ?? [];

    for (const item of items) {
      const bd = item.TrsrBd as RawBondData;
      if (!bd) continue;
      bonds.push({
        name: bd.NmTd ?? "",
        code: bd.NmTd ?? "",
        type: mapType(bd.NmTd ?? ""),
        expiryDate: bd.DtVencimento ?? "",
        buyRate: bd.VlTxCompra ?? 0,
        sellRate: bd.VlTxVenda ?? 0,
        buyPrice: bd.VlPuCompra ?? 0,
        sellPrice: bd.VlPuVenda ?? 0,
        minAmount: bd.VlInvMinimo ?? 30,
      });
    }

    return bonds;
  } catch {
    return [];
  }
}
