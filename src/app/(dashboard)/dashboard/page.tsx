import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import DashboardLayout from './layout'
import { DashboardProvider } from './dashboard-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowUp, ArrowDown, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bem, bemVariant } from '@/lib/bem'

async function getDashboardStats() {
  const [totalItems, lowStockItems, recentStockIn, recentStockOut, pendingOpnames] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.item.count({ where: { isActive: true, currentStock: { lte: prisma.item.fields.minStock } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_IN', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_OUT', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockOpname.count({ where: { status: 'PENDING' } }),
  ])

  return { totalItems, lowStockItems, recentStockIn, recentStockOut, pendingOpnames }
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

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const stats = await getDashboardStats()
  const recentTransactions = await getRecentTransactions()

  const statCards = [
    { title: 'Total Barang', value: stats.totalItems, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Stok Rendah', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Stok Masuk (7 hari)', value: stats.recentStockIn, icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Stok Keluar (7 hari)', value: stats.recentStockOut, icon: ArrowDown, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Opname Pending', value: stats.pendingOpnames, icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]

  return (
    <DashboardProvider>
      <DashboardLayout userRole={user?.role || 'VIEWER'}>
        <div className="space-y-6">
          {/* Header */}
          <div className="dashboard__header">
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">
              Selamat datang, {user?.fullName || 'User'}! Berikut ringkasan stok Anda.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="dashboard__stats-grid">
            {statCards.map((stat) => (
              <Card key={stat.title} className="dashboard__stat-card">
                <CardHeader className="dashboard__stat-card-header">
                  <CardTitle className="dashboard__stat-card-title">{stat.title}</CardTitle>
                  <stat.icon className={cn('dashboard__stat-icon', stat.color)} aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="dashboard__stat-value">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="dashboard__empty-state">Belum ada transaksi</p>
              ) : (
                <div className="dashboard__table-container">
                  <table className="dashboard__table">
                    <thead>
                      <tr className="dashboard__table-row dashboard__table-row--header">
                        <th className="dashboard__table-cell dashboard__table-cell--header">Barang</th>
                        <th className="dashboard__table-cell dashboard__table-cell--header">Tipe</th>
                        <th className="dashboard__table-cell dashboard__table-cell--header">Jumlah</th>
                        <th className="dashboard__table-cell dashboard__table-cell--header">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="dashboard__table-body">
                      {recentTransactions.map((tx) => (
                        <tr key={tx.id} className="dashboard__table-row dashboard__table-row--hover">
                          <td className="dashboard__table-cell">
                            <div className="dashboard__item-name">{tx.item.name}</div>
                            <div className="dashboard__item-code">{tx.item.code}</div>
                          </td>
                          <td className="dashboard__table-cell">
                            <span className={cn(
                              'dashboard__badge',
                              tx.type === 'STOCK_IN' ? 'dashboard__badge--success' :
                              tx.type === 'STOCK_OUT' ? 'dashboard__badge--danger' :
                              'dashboard__badge--warning'
                            )}>
                              {tx.type === 'STOCK_IN' ? 'Masuk' : tx.type === 'STOCK_OUT' ? 'Keluar' : 'Penyesuaian'}
                            </span>
                          </td>
                          <td className="dashboard__table-cell dashboard__table-cell--number">
                            {tx.type === 'STOCK_IN' ? '+' : tx.type === 'STOCK_OUT' ? '-' : ''}{tx.quantity}
                          </td>
                          <td className="dashboard__table-cell dashboard__table-cell--date">
                            {new Date(tx.transactionDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </DashboardProvider>
  )
}
