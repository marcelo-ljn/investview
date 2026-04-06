@AGENTS.md

# Deployment & Database

## URLs

| Env | URL | Status |
|---|---|---|
| **Production** | `https://investview-rho.vercel.app/` | Vercel (investview-rho project) |
| **Local** | `http://localhost:3000/` | Dev server |

## Database Access

| Env | Neon Endpoint | How to connect |
|---|---|---|
| **Local** (`.env.local`) | `ep-young-voice-amfl0666-pooler` | `DATABASE_URL` in `.env.local` |
| **Production** (Vercel) | Same Neon endpoint — **same DB** | Env vars set in Vercel dashboard |

> **CRITICAL**: Local and production share the **same Neon database**. Any data mutation run locally (migrations, direct Prisma scripts, `db push`) affects production immediately. Never delete or overwrite data without explicit user confirmation.

## Safe operations
- Schema migrations: `npx prisma migrate dev` locally generates migration file; `npx prisma migrate deploy` applies in prod CI
- Schema drift fix: `npx prisma db push` (skips migration history — use only in dev, NEVER in prod)
- Direct DB queries for read-only inspection: OK
- `deleteMany` / `update` scripts: **Always confirm scope with user first**

## Admin endpoints (auth-protected, no CRON_SECRET needed)
- `GET /api/admin/migrate` — backfill CDI history + apply indexer/rate to RF positions
  - `?step=backfill` — CDI history only
  - `?step=indexer` — indexer/rate on positions/transactions only
  - `?step=all` — both (default)
  - `&from=YYYY-MM-DD&to=YYYY-MM-DD` — date range for backfill

## Cron endpoints (require `Authorization: Bearer $CRON_SECRET`)
- `GET /api/cron/sync-rates` — sync today's rates from BCB
- `GET /api/cron/sync-rates?backfill=true&from=YYYY-MM-DD&to=YYYY-MM-DD` — CDI backfill via BCB date-range API
