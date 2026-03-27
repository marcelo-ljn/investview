import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "InvestView — Plataforma de Investimentos BR"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0b 0%, #1a1a2e 50%, #0a0a0b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            background: "#3b82f6",
            borderRadius: 12,
            padding: 16,
            display: "flex",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: "white" }}>InvestView</span>
        </div>

        <p style={{ fontSize: 28, color: "#94a3b8", textAlign: "center", maxWidth: 700, lineHeight: 1.4 }}>
          Ações, FIIs, Renda Fixa, ETFs e Cripto com gráficos avançados e simulações
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          {["Tesouro Direto ao vivo", "FIRE Calculator", "Portfolio com P&L", "Charts interativos"].map((f) => (
            <div key={f} style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 100,
              padding: "8px 20px",
              color: "#93c5fd",
              fontSize: 18,
            }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
