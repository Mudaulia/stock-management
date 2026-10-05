import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import DashboardLayout from './layout'
import { StatCards } from './components/StatCards'
import { ActionButtons } from './components/ActionButtons'
import { RecentTransactionsTable } from './components/RecentTransactionsTable'
import { LowStockAlert } from './components/LowStockAlert'
import { cn } from '@/lib/utils'
import { Plus, ArrowUp, ArrowDown, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const [totalItems, lowStockItems, outOfStockItems, recentStockIn, recentStockOut, pendingOpnames] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.item.count({ where: { isActive: true, currentStock: { gt: 0, lte: prisma.item.fields.minStock } } }),
    prisma.item.count({ where: { isActive: true, currentStock: { lte: 0 } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_IN', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_OUT', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockOpname.count({ where: { status: 'PENDING' } }),
  ])

  return { totalItems, lowStockItems, outOfStockItems, recentStockIn, recentStockOut, pendingOpnames }
}

async function getRecentTransactions(): Promise<
  Prisma.StockTransactionGetPayload<{
    include: { item: { select: { name: true; code: true } } }
  }>[]
> {
  return prisma.stockTransaction.findMany({
    take: 5,
    orderBy: { transactionDate: 'desc' },
    include: { item: { select: { name: true, code: true } } },
  })
}

async function getLowStockItems(): Promise<
  Prisma.ItemGetPayload<{
    select: { id: true; code: true; name: true; currentStock: true; minStock: true; unit: true }
  }>[]
> {
  return prisma.item.findMany({
    where: {
      isActive: true,
      currentStock: { lte: prisma.item.fields.minStock },
    },
    orderBy: { currentStock: 'asc' },
    take: 5,
    select: { id: true, code: true, name: true, currentStock: true, minStock: true, unit: true },
  })
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const stats = await getDashboardStats()
  const recentTransactions = await getRecentTransactions()
  const lowStockItems = await getLowStockItems()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang, {user?.fullName || 'User'}! Berikut ringkasan stok Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/items">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Barang
              </button>
            </Link>
            <Link href="/dashboard/stock-in">
              <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                Stok Masuk
              </button>
            </Link>
            <Link href="/dashboard/stock-out">
              <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                Stok Keluar
              </button>
            </Link>
            <Link href="/dashboard/opname">
              <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Opname
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <StatCards
          totalItems={stats.totalItems}
          lowStockItems={stats.lowStockItems}
          outOfStockItems={stats.outOfStockItems}
          recentStockIn={stats.recentStockIn}
          recentStockOut={stats.recentStockOut}
          pendingOpnames={stats.pendingOpnames}
        />

        {/* Two Column Layout: Recent Transactions + Low Stock Alert */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Recent Transactions - 8 cols on lg */}
          <div className="lg:col-span-8">
            <RecentTransactionsTable transactions={recentTransactions} />
          </div>

          {/* Low Stock Alert - 4 cols on lg */}
          <div className="lg:col-span-4">
            <LowStockAlert items={lowStockItems} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
