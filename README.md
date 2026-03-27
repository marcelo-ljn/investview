# InvestView 📈

Plataforma de investimentos brasileira com análise avançada — alternativa ao Investidor10 com diferenciais em gráficos, simulações e projeções.

**🚀 Deploy:** https://investview-eb4pz62zd-marcelo-ljns-projects.vercel.app  
**📋 Roadmap:** https://github.com/users/marcelo-ljn/projects/2

---

## Features

| Feature | Status |
|---|---|
| Login via Google (NextAuth v5) | ✅ |
| Ações BR + detalhe + charts | ✅ |
| FIIs — listagem, detalhe, rendimentos | ✅ |
| Renda Fixa — Tesouro Direto ao vivo + BCB | ✅ |
| ETFs brasileiros | ✅ |
| Criptomoedas (CoinGecko, BRL) | ✅ |
| Simulador Renda Fixa com IR regressivo | ✅ |
| FIRE Calculator (regra dos 4%, 3 cenários) | ✅ |
| Comparador de ativos (até 5 simultâneos) | ✅ |
| Portfolio CRUD — compra/venda/dividendo | ✅ |
| P&L ao vivo + peso na carteira | ✅ |
| Dark/light mode | ✅ |
| SEO + sitemap + OG image | ✅ |
| Vercel deploy + cron jobs | ✅ |
| Import carteira B3 (CSV) | 🔲 |
| Alertas de preço | 🔲 |

---

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind v4, Recharts
- **Auth:** NextAuth v5 (Google OAuth)
- **DB:** Prisma ORM + Neon PostgreSQL (serverless)
- **Storage:** Vercel Blob
- **Deploy:** Vercel

## APIs utilizadas

| API | Dados | Limite free |
|---|---|---|
| brapi.dev | Cotações BR/US, histórico, dividendos | Rate limited sem token |
| api.bcb.gov.br | CDI, SELIC, IPCA, IGP-M | Público |
| tesourodireto.com.br | Tesouro Direto ao vivo | Público |
| CoinGecko | Criptomoedas em BRL | 30 req/min |

---

## Setup Local

```bash
git clone https://github.com/marcelo-ljn/investview.git
cd investview
npm install
cp .env.example .env.local
# edite .env.local com suas credenciais
npx prisma migrate dev --name init
npm run dev
```

Veja `.env.example` para todas as variáveis necessárias.

## Diferenciais vs Investidor10

| Funcionalidade | Investidor10 | InvestView |
|---|---|---|
| Simulador IR regressivo | ❌ | ✅ |
| FIRE Calculator (regra 4%) | ❌ | ✅ |
| Análise de sensibilidade | ❌ | ✅ |
| Charts interativos | Básico | ✅ Recharts |
| Dark mode | Parcial | ✅ |
| Open source | ❌ | ✅ |
| API BCB integrada | ❌ | ✅ |
| Comparador multi-ativo | Limitado | ✅ Até 5 |
