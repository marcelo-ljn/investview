-- CreateEnum
CREATE TYPE "InvestorProfile" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'FII', 'ETF', 'US_STOCK', 'CRYPTO', 'FIXED_INCOME');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'JCP', 'AMORTIZATION', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "FixedIncomeType" AS ENUM ('TESOURO_SELIC', 'TESOURO_IPCA', 'TESOURO_PREFIXADO', 'CDB', 'LCI', 'LCA', 'LIG', 'CRI', 'CRA', 'DEBENTURE', 'POUPANCA');

-- CreateEnum
CREATE TYPE "Indexer" AS ENUM ('CDI', 'SELIC', 'IPCA', 'IGPM', 'PREFIXADO', 'IPCA_PLUS', 'CDI_PLUS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "bio" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "investorProfile" "InvestorProfile" NOT NULL DEFAULT 'MODERATE',
    "watchedAssetTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "stocks" (
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "longName" TEXT,
    "sector" TEXT,
    "subSector" TEXT,
    "segment" TEXT,
    "exchange" TEXT NOT NULL DEFAULT 'BVMF',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "logoUrl" TEXT,
    "about" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("ticker")
);

-- CreateTable
CREATE TABLE "stock_prices" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_fundamentals" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pl" DOUBLE PRECISION,
    "pvp" DOUBLE PRECISION,
    "roe" DOUBLE PRECISION,
    "roic" DOUBLE PRECISION,
    "rlv" DOUBLE PRECISION,
    "ebitda" DOUBLE PRECISION,
    "ebit" DOUBLE PRECISION,
    "lucroLiquido" DOUBLE PRECISION,
    "dividaLiquida" DOUBLE PRECISION,
    "dividaEbitda" DOUBLE PRECISION,
    "dyTtm" DOUBLE PRECISION,
    "psr" DOUBLE PRECISION,
    "evEbitda" DOUBLE PRECISION,
    "evEbit" DOUBLE PRECISION,
    "lpa" DOUBLE PRECISION,
    "vpa" DOUBLE PRECISION,
    "mrEbit" DOUBLE PRECISION,
    "mrLucro" DOUBLE PRECISION,
    "cagr5Anos" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_fundamentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_dividends" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "exDate" DATE NOT NULL,
    "payDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiis" (
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "longName" TEXT,
    "fiiType" TEXT,
    "segment" TEXT,
    "manager" TEXT,
    "admin" TEXT,
    "logoUrl" TEXT,
    "about" TEXT,
    "cnpj" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiis_pkey" PRIMARY KEY ("ticker")
);

-- CreateTable
CREATE TABLE "fii_prices" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fii_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fii_fundamentals" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pvp" DOUBLE PRECISION,
    "dyMes" DOUBLE PRECISION,
    "dy12M" DOUBLE PRECISION,
    "vacancia" DOUBLE PRECISION,
    "abl" DOUBLE PRECISION,
    "numImoveis" INTEGER,
    "numCotas" BIGINT,
    "vlCota" DOUBLE PRECISION,
    "patrimonio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fii_fundamentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fii_dividends" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "exDate" DATE NOT NULL,
    "payDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fii_dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_income_assets" (
    "id" TEXT NOT NULL,
    "type" "FixedIncomeType" NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "indexer" "Indexer" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "minAmount" DOUBLE PRECISION,
    "maxAmount" DOUBLE PRECISION,
    "maturityDate" DATE,
    "liquidityDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_income_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_bonds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiryDate" DATE NOT NULL,
    "buyRate" DOUBLE PRECISION NOT NULL,
    "sellRate" DOUBLE PRECISION NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_bonds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_rates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" DATE NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "condition" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "stock_prices_ticker_date_idx" ON "stock_prices"("ticker", "date");

-- CreateIndex
CREATE UNIQUE INDEX "stock_prices_ticker_date_key" ON "stock_prices"("ticker", "date");

-- CreateIndex
CREATE UNIQUE INDEX "stock_fundamentals_ticker_date_key" ON "stock_fundamentals"("ticker", "date");

-- CreateIndex
CREATE INDEX "stock_dividends_ticker_exDate_idx" ON "stock_dividends"("ticker", "exDate");

-- CreateIndex
CREATE UNIQUE INDEX "stock_dividends_ticker_type_exDate_key" ON "stock_dividends"("ticker", "type", "exDate");

-- CreateIndex
CREATE INDEX "fii_prices_ticker_date_idx" ON "fii_prices"("ticker", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fii_prices_ticker_date_key" ON "fii_prices"("ticker", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fii_fundamentals_ticker_date_key" ON "fii_fundamentals"("ticker", "date");

-- CreateIndex
CREATE INDEX "fii_dividends_ticker_exDate_idx" ON "fii_dividends"("ticker", "exDate");

-- CreateIndex
CREATE UNIQUE INDEX "fii_dividends_ticker_exDate_key" ON "fii_dividends"("ticker", "exDate");

-- CreateIndex
CREATE UNIQUE INDEX "treasury_bonds_code_key" ON "treasury_bonds"("code");

-- CreateIndex
CREATE INDEX "economic_rates_name_date_idx" ON "economic_rates"("name", "date");

-- CreateIndex
CREATE UNIQUE INDEX "economic_rates_name_date_key" ON "economic_rates"("name", "date");

-- CreateIndex
CREATE UNIQUE INDEX "positions_portfolioId_ticker_key" ON "positions"("portfolioId", "ticker");

-- CreateIndex
CREATE INDEX "transactions_portfolioId_ticker_idx" ON "transactions"("portfolioId", "ticker");

-- CreateIndex
CREATE INDEX "transactions_portfolioId_date_idx" ON "transactions"("portfolioId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_snapshots_portfolioId_date_key" ON "portfolio_snapshots"("portfolioId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_userId_ticker_key" ON "watchlist"("userId", "ticker");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "stocks"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_fundamentals" ADD CONSTRAINT "stock_fundamentals_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "stocks"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_dividends" ADD CONSTRAINT "stock_dividends_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "stocks"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fii_prices" ADD CONSTRAINT "fii_prices_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "fiis"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fii_fundamentals" ADD CONSTRAINT "fii_fundamentals_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "fiis"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fii_dividends" ADD CONSTRAINT "fii_dividends_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "fiis"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_stock_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "stocks"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_fii_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "fiis"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_stock_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "stocks"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_fii_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "fiis"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
