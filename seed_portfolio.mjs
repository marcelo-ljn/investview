import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const PORTFOLIO_ID = 'cmn8t4ds50001la04fm85ic3w'

const stocks = ['BBAS3','BBDC3','BRBI11','CMIG3','FIQE3','ITSA4','KLBN4','PETR4','TAEE4','VALE3']
const fiis   = ['KNCR11','XPML11']

const stockNames = {
  BBAS3: 'Banco do Brasil', BBDC3: 'Bradesco', BRBI11: 'BR Partners',
  CMIG3: 'CEMIG', FIQE3: 'Fiqe Participações', ITSA4: 'Itaúsa',
  KLBN4: 'Klabin', PETR4: 'Petrobras', TAEE4: 'Taesa', VALE3: 'Vale'
}
const fiiNames = { KNCR11: 'Kinea Recebíveis Imobiliários', XPML11: 'XP Malls' }

const transactions = [
  { ticker: 'BBAS3',  assetType: 'STOCK', type: 'BUY', quantity: 10,  price: 21.35,  date: new Date('2025-10-29') },
  { ticker: 'BBAS3',  assetType: 'STOCK', type: 'BUY', quantity: 20,  price: 21.71,  date: new Date('2026-01-05') },
  { ticker: 'BBDC3',  assetType: 'STOCK', type: 'BUY', quantity: 10,  price: 15.43,  date: new Date('2025-10-30') },
  { ticker: 'BBDC3',  assetType: 'STOCK', type: 'BUY', quantity: 30,  price: 15.60,  date: new Date('2026-01-05') },
  { ticker: 'BRBI11', assetType: 'STOCK', type: 'BUY', quantity: 17,  price: 19.43,  date: new Date('2025-10-30') },
  { ticker: 'BRBI11', assetType: 'STOCK', type: 'BUY', quantity: 30,  price: 19.00,  date: new Date('2026-01-15') },
  { ticker: 'CMIG3',  assetType: 'STOCK', type: 'BUY', quantity: 20,  price: 14.22,  date: new Date('2025-10-30') },
  { ticker: 'CMIG3',  assetType: 'STOCK', type: 'BUY', quantity: 50,  price: 14.60,  date: new Date('2026-01-05') },
  { ticker: 'CMIG3',  assetType: 'STOCK', type: 'BUY', quantity: 30,  price: 14.27,  date: new Date('2026-01-15') },
  { ticker: 'FIQE3',  assetType: 'STOCK', type: 'BUY', quantity: 20,  price: 4.80,   date: new Date('2025-10-30') },
  { ticker: 'FIQE3',  assetType: 'STOCK', type: 'BUY', quantity: 2,   price: 5.40,   date: new Date('2026-01-02') },
  { ticker: 'FIQE3',  assetType: 'STOCK', type: 'BUY', quantity: 100, price: 4.91,   date: new Date('2026-01-05') },
  { ticker: 'ITSA4',  assetType: 'STOCK', type: 'BUY', quantity: 10,  price: 11.51,  date: new Date('2025-10-30') },
  { ticker: 'KLBN4',  assetType: 'STOCK', type: 'BUY', quantity: 30,  price: 3.59,   date: new Date('2025-10-30') },
  { ticker: 'KLBN4',  assetType: 'STOCK', type: 'BUY', quantity: 200, price: 3.77,   date: new Date('2026-01-05') },
  { ticker: 'KNCR11', assetType: 'FII',   type: 'BUY', quantity: 1,   price: 106.07, date: new Date('2025-10-30') },
  { ticker: 'KNCR11', assetType: 'FII',   type: 'BUY', quantity: 5,   price: 104.75, date: new Date('2025-11-03') },
  { ticker: 'KNCR11', assetType: 'FII',   type: 'BUY', quantity: 5,   price: 106.58, date: new Date('2026-01-05') },
  { ticker: 'PETR4',  assetType: 'STOCK', type: 'BUY', quantity: 15,  price: 29.86,  date: new Date('2025-10-30') },
  { ticker: 'TAEE4',  assetType: 'STOCK', type: 'BUY', quantity: 10,  price: 12.71,  date: new Date('2025-10-30') },
  { ticker: 'TAEE4',  assetType: 'STOCK', type: 'BUY', quantity: 100, price: 14.12,  date: new Date('2026-01-05') },
  { ticker: 'TAEE4',  assetType: 'STOCK', type: 'BUY', quantity: 30,  price: 13.42,  date: new Date('2026-01-15') },
  { ticker: 'VALE3',  assetType: 'STOCK', type: 'BUY', quantity: 1,   price: 63.40,  date: new Date('2025-10-30') },
  { ticker: 'VALE3',  assetType: 'STOCK', type: 'BUY', quantity: 10,  price: 72.77,  date: new Date('2026-01-05') },
  { ticker: 'XPML11', assetType: 'FII',   type: 'BUY', quantity: 5,   price: 105.81, date: new Date('2025-11-03') },
]

async function main() {
  // 1. Upsert stocks
  console.log('Inserindo tickers em stocks...')
  for (const ticker of stocks) {
    await prisma.stock.upsert({
      where: { ticker },
      create: { ticker, name: stockNames[ticker] || ticker },
      update: {}
    })
  }
  // 2. Upsert fiis
  console.log('Inserindo tickers em fiis...')
  for (const ticker of fiis) {
    await prisma.fII.upsert({
      where: { ticker },
      create: { ticker, name: fiiNames[ticker] || ticker },
      update: {}
    })
  }

  // 3. Insert transactions
  console.log('Inserindo', transactions.length, 'transações...')
  for (const tx of transactions) {
    await prisma.transaction.create({
      data: { portfolioId: PORTFOLIO_ID, ticker: tx.ticker, assetType: tx.assetType, type: tx.type, quantity: tx.quantity, price: tx.price, fees: 0, date: tx.date }
    })
    process.stdout.write('.')
  }
  console.log('\n✅ Transações inseridas!')

  // 4. Compute and upsert positions
  const positions = {}
  for (const tx of [...transactions].sort((a,b) => a.date - b.date)) {
    if (!positions[tx.ticker]) positions[tx.ticker] = { qty: 0, total: 0, assetType: tx.assetType }
    positions[tx.ticker].qty += tx.quantity
    positions[tx.ticker].total += tx.quantity * tx.price
  }

  console.log('\nCriando posições:')
  for (const [ticker, pos] of Object.entries(positions)) {
    const averagePrice = pos.total / pos.qty
    await prisma.position.upsert({
      where: { portfolioId_ticker: { portfolioId: PORTFOLIO_ID, ticker } },
      create: { portfolioId: PORTFOLIO_ID, ticker, assetType: pos.assetType, quantity: pos.qty, averagePrice },
      update: { quantity: pos.qty, averagePrice }
    })
    console.log(`  ${ticker.padEnd(8)} ${pos.qty.toString().padStart(4)}x @ R$ ${averagePrice.toFixed(2).padStart(7)} = R$ ${pos.total.toFixed(2).padStart(10)}`)
  }
  console.log('\n✅ Portfolio populado com', Object.keys(positions).length, 'ativos!')
}

main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
