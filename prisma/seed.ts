import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

/**
 * Seed password diambil dari environment variable.
 * Fallback default HANYA untuk development; di production seed gagal
 * jika password tidak disediakan (mencegah kredensial lemah hardcoded).
 */
function getSeedPassword(name: string, envVar: string): string {
  const value = process.env[envVar]
  if (value) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${envVar} wajib diset saat menjalankan seed di production (mencegah kredensial lemah)`
    )
  }
  console.warn(
    `⚠️  ${envVar} tidak diset — memakai password default untuk ${name}. Jangan gunakan default ini di production.`
  )
  return `${name}123`
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await hashPassword(getSeedPassword('admin', 'SEED_ADMIN_PASSWORD'))
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stockapp.com' },
    update: {},
    create: {
      email: 'admin@stockapp.com',
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create warehouse staff user
  const staffPassword = await hashPassword(getSeedPassword('staff', 'SEED_STAFF_PASSWORD'))
  const staff = await prisma.user.upsert({
    where: { email: 'staff@stockapp.com' },
    update: {},
    create: {
      email: 'staff@stockapp.com',
      username: 'staff',
      passwordHash: staffPassword,
      fullName: 'Petugas Gudang',
      role: Role.WAREHOUSE_STAFF,
      isActive: true,
    },
  })
  console.log('✅ Created staff user:', staff.email)

  // Create viewer user
  const viewerPassword = await hashPassword(getSeedPassword('viewer', 'SEED_VIEWER_PASSWORD'))
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@stockapp.com' },
    update: {},
    create: {
      email: 'viewer@stockapp.com',
      username: 'viewer',
      passwordHash: viewerPassword,
      fullName: 'Viewer Only',
      role: Role.VIEWER,
      isActive: true,
    },
  })
  console.log('✅ Created viewer user:', viewer.email)

  // Create sample items.
  // Ledger invariant: currentStock must equal the sum of stock transactions.
  // Items are created with currentStock = 0, then seeded via stock
  // transactions (INITIAL + samples) so the ledger reconciles with stock.
  type SeedItem = {
    code: string
    name: string
    unit: string
    minStock: number
    targetStock: number
    description: string
  }

  const items: SeedItem[] = [
    { code: 'SP-001', name: 'Filter Oli', unit: 'PCS', minStock: 10, targetStock: 25, description: 'Filter oli untuk mesin diesel' },
    { code: 'SP-002', name: 'Busi NGK', unit: 'PCS', minStock: 20, targetStock: 50, description: 'Busi standar NGK' },
    { code: 'SP-003', name: 'Oli Mesin 10W-40', unit: 'LITER', minStock: 15, targetStock: 30, description: 'Oli mesin semi-sintetis' },
    { code: 'SP-004', name: 'Kampas Rem Depan', unit: 'SET', minStock: 5, targetStock: 8, description: 'Kampas rem cakram depan' },
    { code: 'SP-005', name: 'Kampas Rem Belakang', unit: 'SET', minStock: 5, targetStock: 3, description: 'Kampas rem tromol belakang' },
    { code: 'SP-006', name: 'Filter Udara', unit: 'PCS', minStock: 10, targetStock: 12, description: 'Filter udara mesin' },
    { code: 'SP-007', name: 'Aki Kering 12V 35Ah', unit: 'UNIT', minStock: 3, targetStock: 5, description: 'Aki free maintenance' },
    { code: 'SP-008', name: 'Lampu LED H4', unit: 'PCS', minStock: 10, targetStock: 20, description: 'Lampu depan LED H4' },
    { code: 'SP-009', name: 'Kabel Kopling', unit: 'PCS', minStock: 5, targetStock: 7, description: 'Kabel kopling standar' },
    { code: 'SP-010', name: 'Rantai + Sproket Set', unit: 'SET', minStock: 3, targetStock: 4, description: 'Set rantai dan sproket' },
  ]

  for (const { targetStock, ...item } of items) {
    const existing = await prisma.item.findUnique({ where: { code: item.code } })
    if (existing) {
      // Idempotent: skip already-seeded items (do not mutate live data).
      continue
    }
    await prisma.item.create({
      data: { ...item, currentStock: 0 },
    })

    // INITIAL stock-in so the ledger matches currentStock.
    // SP-001..SP-003 get their target via the sample in/out rows below
    // (initial + samples = targetStock); other items get initial = target.
    const initialQty: Record<string, number> = {
      'SP-001': 10,
      'SP-002': 10,
      'SP-003': 0,
    }
    const qty = initialQty[item.code] ?? targetStock
    if (qty > 0) {
      const created = await prisma.item.findUniqueOrThrow({
        where: { code: item.code },
      })
      await prisma.stockTransaction.create({
        data: {
          itemId: created.id,
          type: 'STOCK_IN',
          quantity: qty,
          reference: 'INITIAL',
          notes: 'Stok awal seed',
          createdById: admin.id,
        },
      })
      await prisma.item.update({
        where: { id: created.id },
        data: { currentStock: { increment: qty } },
      })
    }
  }
  console.log('✅ Created sample items')

  // Create sample stock in transactions (ledger-consistent: each row is
  // accompanied by the corresponding currentStock increment).
  const item1 = await prisma.item.findUnique({ where: { code: 'SP-001' } })
  const item2 = await prisma.item.findUnique({ where: { code: 'SP-002' } })
  const item3 = await prisma.item.findUnique({ where: { code: 'SP-003' } })

  if (item1 && item2 && item3) {
    await prisma.stockTransaction.createMany({
      data: [
        { itemId: item1.id, type: 'STOCK_IN', quantity: 20, reference: 'PO-2024-001', notes: 'Pembelian rutin bulanan', createdById: admin.id },
        { itemId: item2.id, type: 'STOCK_IN', quantity: 50, reference: 'PO-2024-002', notes: 'Restok busi', createdById: admin.id },
        { itemId: item3.id, type: 'STOCK_IN', quantity: 30, reference: 'PO-2024-003', notes: 'Pembelian oli baru', createdById: staff.id },
      ],
      skipDuplicates: true,
    })
    await prisma.item.update({ where: { id: item1.id }, data: { currentStock: { increment: 20 } } })
    await prisma.item.update({ where: { id: item2.id }, data: { currentStock: { increment: 50 } } })
    await prisma.item.update({ where: { id: item3.id }, data: { currentStock: { increment: 30 } } })
    console.log('✅ Created sample stock in transactions')
  }

  // Create sample stock out transactions (with corresponding decrements).
  if (item1 && item2) {
    await prisma.stockTransaction.createMany({
      data: [
        { itemId: item1.id, type: 'STOCK_OUT', quantity: 5, reference: 'SO-2024-001', notes: 'Penggunaan servis', createdById: staff.id },
        { itemId: item2.id, type: 'STOCK_OUT', quantity: 10, reference: 'SO-2024-002', notes: 'Penjualan ke customer', createdById: staff.id },
      ],
      skipDuplicates: true,
    })
    await prisma.item.update({ where: { id: item1.id }, data: { currentStock: { decrement: 5 } } })
    await prisma.item.update({ where: { id: item2.id }, data: { currentStock: { decrement: 10 } } })
    console.log('✅ Created sample stock out transactions')
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })