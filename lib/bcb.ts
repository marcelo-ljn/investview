/**
 * Banco Central do Brasil — API pública de taxas econômicas
 * Docs: https://api.bcb.gov.br
 */

const BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

// Série CDI diário: 11
// Série SELIC meta: 432
// Série IPCA mensal: 433
// Série IGPM mensal: 189

export async function fetchCDI(): Promise<{ value: number; date: string } | null> {
  try {
    const res = await fetch(
      `${BCB_BASE}.11/dados/ultimos/1?formato=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const row = data[0];
    return { value: parseFloat(row.valor), date: row.data };
  } catch {
    return null;
  }
}

export async function fetchSELIC(): Promise<{ value: number; date: string } | null> {
  try {
    const res = await fetch(
      `${BCB_BASE}.432/dados/ultimos/1?formato=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const row = data[0];
    return { value: parseFloat(row.valor), date: row.data };
  } catch {
    return null;
  }
}

export async function fetchIPCA(): Promise<{ value: number; date: string } | null> {
  try {
    const res = await fetch(
      `${BCB_BASE}.433/dados/ultimos/1?formato=json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const row = data[0];
    return { value: parseFloat(row.valor), date: row.data };
  } catch {
    return null;
  }
}

export async function fetchIGPM(): Promise<{ value: number; date: string } | null> {
  try {
    const res = await fetch(
      `${BCB_BASE}.189/dados/ultimos/1?formato=json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const row = data[0];
    return { value: parseFloat(row.valor), date: row.data };
  } catch {
    return null;
  }
}

export async function fetchCDIHistory(
  months = 24
): Promise<{ value: number; date: string }[]> {
  try {
    const res = await fetch(
      `${BCB_BASE}.11/dados/ultimos/${months * 22}?formato=json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((row: { valor: string; data: string }) => ({
      value: parseFloat(row.valor),
      date: row.data,
    }));
  } catch {
    return [];
  }
}

export async function fetchAllRates() {
  const [cdi, selic, ipca, igpm] = await Promise.allSettled([
    fetchCDI(),
    fetchSELIC(),
    fetchIPCA(),
    fetchIGPM(),
  ]);

  return {
    cdi: cdi.status === "fulfilled" ? cdi.value?.value ?? 0 : 0,
    selic: selic.status === "fulfilled" ? selic.value?.value ?? 0 : 0,
    ipca: ipca.status === "fulfilled" ? ipca.value?.value ?? 0 : 0,
    igpm: igpm.status === "fulfilled" ? igpm.value?.value ?? 0 : 0,
    updatedAt: new Date().toISOString(),
  };
}
