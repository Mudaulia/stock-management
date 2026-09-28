import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
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
  const staffPassword = await hashPassword('staff123')
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
  const viewerPassword = await hashPassword('viewer123')
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

  // Create sample items
  const items = [
    { code: 'SP-001', name: 'Filter Oli', unit: 'PCS', minStock: 10, currentStock: 25, description: 'Filter oli untuk mesin diesel' },
    { code: 'SP-002', name: 'Busi NGK', unit: 'PCS', minStock: 20, currentStock: 50, description: 'Busi standar NGK' },
    { code: 'SP-003', name: 'Oli Mesin 10W-40', unit: 'LITER', minStock: 15, currentStock: 30, description: 'Oli mesin semi-sintetis' },
    { code: 'SP-004', name: 'Kampas Rem Depan', unit: 'SET', minStock: 5, currentStock: 8, description: 'Kampas rem cakram depan' },
    { code: 'SP-005', name: 'Kampas Rem Belakang', unit: 'SET', minStock: 5, currentStock: 3, description: 'Kampas rem tromol belakang' },
    { code: 'SP-006', name: 'Filter Udara', unit: 'PCS', minStock: 10, currentStock: 12, description: 'Filter udara mesin' },
    { code: 'SP-007', name: 'Aki Kering 12V 35Ah', unit: 'UNIT', minStock: 3, currentStock: 5, description: 'Aki free maintenance' },
    { code: 'SP-008', name: 'Lampu LED H4', unit: 'PCS', minStock: 10, currentStock: 20, description: 'Lampu depan LED H4' },
    { code: 'SP-009', name: 'Kabel Kopling', unit: 'PCS', minStock: 5, currentStock: 7, description: 'Kabel kopling standar' },
    { code: 'SP-010', name: 'Rantai + Sproket Set', unit: 'SET', minStock: 3, currentStock: 4, description: 'Set rantai dan sproket' },
  ]

  for (const item of items) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    })
  }
  console.log('✅ Created sample items')

  // Create sample stock in transactions
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
    console.log('✅ Created sample stock in transactions')
  }

  // Create sample stock out transactions
  if (item1 && item2) {
    await prisma.stockTransaction.createMany({
      data: [
        { itemId: item1.id, type: 'STOCK_OUT', quantity: 5, reference: 'SO-2024-001', notes: 'Penggunaan servis', createdById: staff.id },
        { itemId: item2.id, type: 'STOCK_OUT', quantity: 10, reference: 'SO-2024-002', notes: 'Penjualan ke customer', createdById: staff.id },
      ],
      skipDuplicates: true,
    })
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