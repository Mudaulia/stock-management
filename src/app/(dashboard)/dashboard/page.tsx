import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import DashboardLayout from './layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowUp, ArrowDown, ClipboardCheck, AlertTriangle, Plus, Search, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bem, bemVariant } from '@/lib/bem'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardStats() {
  const [totalItems, lowStockItems, outOfStockItems, recentStockIn, recentStockOut, pendingOpnames, totalStockValue] = await Promise.all([
    prisma.item.count({ where: { isActive: true } }),
    prisma.item.count({ where: { isActive: true, currentStock: { gt: 0, lte: prisma.item.fields.minStock } } }),
    prisma.item.count({ where: { isActive: true, currentStock: { lte: 0 } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_IN', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockTransaction.count({ where: { type: 'STOCK_OUT', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.stockOpname.count({ where: { status: 'PENDING' } }),
    prisma.item.aggregate({
      where: { isActive: true },
      _sum: { currentStock: true },
    }),
  ])

  return { totalItems, lowStockItems, outOfStockItems, recentStockIn, recentStockOut, pendingOpnames, totalStockValue: totalStockValue._sum.currentStock || 0 }
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

const statCards = [
  { 
    title: 'Total Barang', 
    value: 0, // will be replaced
    icon: Package, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    href: '/dashboard/items',
    label: 'Kelola Barang'
  },
  { 
    title: 'Stok Rendah', 
    value: 0,
    icon: AlertTriangle, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-100',
    href: '/dashboard/reports/low-stock',
    label: 'Lihat Detail'
  },
  { 
    title: 'Stok Habis', 
    value: 0,
    icon: Minus, 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    href: '/dashboard/reports/low-stock?includeZeroStock=true',
    label: 'Lihat Detail'
  },
  { 
    title: 'Stok Masuk (7 hari)', 
    value: 0,
    icon: ArrowUp, 
    color: 'text-green-600', 
    bg: 'bg-green-100',
    href: '/dashboard/reports/mutation?type=STOCK_IN',
    label: 'Lihat Mutasi'
  },
  { 
    title: 'Stok Keluar (7 hari)', 
    value: 0,
    icon: ArrowDown, 
    color: 'text-orange-600', 
    bg: 'bg-orange-100',
    href: '/dashboard/reports/mutation?type=STOCK_OUT',
    label: 'Lihat Mutasi'
  },
  { 
    title: 'Opname Pending', 
    value: 0,
    icon: ClipboardCheck, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    href: '/dashboard/opname',
    label: 'Kelola Opname'
  },
]

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const stats = await getDashboardStats()
  const recentTransactions = await getRecentTransactions()
  const lowStockItems = await getLowStockItems()

  const statCardsWithData = statCards.map((card, index) => {
    const values = [
      stats.totalItems,
      stats.lowStockItems,
      stats.outOfStockItems,
      stats.recentStockIn,
      stats.recentStockOut,
      stats.pendingOpnames,
    ]
    return { ...card, value: values[index] }
  })

  return (
    <DashboardLayout userRole={user?.role || 'VIEWER'}>
      <div className="space-y-6">
          {/* Header with Quick Actions */}
          <div className="dashboard__header">
            <div className="dashboard__header-content">
              <div>
                <h1 className="dashboard__title">Dashboard</h1>
                <p className="dashboard__subtitle">
                  Selamat datang, {user?.fullName || 'User'}! Berikut ringkasan stok Anda.
                </p>
              </div>
              <div className="dashboard__header-actions">
                <Link href="/dashboard/items" className="dashboard__quick-action">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Barang
                  </Button>
                </Link>
                <Link href="/dashboard/stock-in" className="dashboard__quick-action">
                  <Button variant="outline">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Stok Masuk
                  </Button>
                </Link>
                <Link href="/dashboard/stock-out" className="dashboard__quick-action">
                  <Button variant="outline">
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Stok Keluar
                  </Button>
                </Link>
                <Link href="/dashboard/opname" className="dashboard__quick-action">
                  <Button variant="outline">
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Opname
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid - Clickable Cards */}
          <div className="dashboard__stats-grid">
            {statCardsWithData.map((stat) => (
              <Link key={stat.title} href={stat.href} className="dashboard__stat-link">
                <Card className="dashboard__stat-card">
                  <CardHeader className="dashboard__stat-card-header">
                    <CardTitle className="dashboard__stat-card-title">{stat.title}</CardTitle>
                    <stat.icon className={cn('dashboard__stat-icon', stat.color)} aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="dashboard__stat-value">{stat.value}</div>
                    <div className="dashboard__stat-action">
                      <span className="dashboard__stat-action-label">{stat.label}</span>
                      <ExternalLink className="dashboard__stat-action-icon" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Two Column Layout: Recent Transactions + Low Stock Alert */}
          <div className="dashboard__two-column">
            {/* Recent Transactions */}
            <Card className="dashboard__card--full-height">
              <CardHeader className="dashboard__card-header-with-action">
                <CardTitle>Transaksi Terbaru</CardTitle>
                <Link href="/dashboard/reports/mutation" className="dashboard__view-all">
                  <span>Lihat Semua</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="dashboard__empty-state">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>Belum ada transaksi</p>
                    <Link href="/dashboard/stock-in" className="dashboard__empty-action">
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Buat Transaksi Pertama</Button>
                    </Link>
                  </div>
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

            {/* Low Stock Alert */}
            <Card className="dashboard__card--full-height">
              <CardHeader className="dashboard__card-header-with-action">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Perhatian: Stok Rendah
                  </div>
                </CardTitle>
                <Link href="/dashboard/reports/low-stock" className="dashboard__view-all">
                  <span>Lihat Semua</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="dashboard__empty-state dashboard__empty-state--success">
                    <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-600">Semua stok dalam kondisi baik</p>
                    <p className="text-sm text-gray-500 mt-1">Tidak ada barang dengan stok di bawah minimum</p>
                  </div>
                ) : (
                  <div className="dashboard__alert-list">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="dashboard__alert-item">
                        <div className="dashboard__alert-item-info">
                          <div className="dashboard__alert-item-name">{item.name}</div>
                          <div className="dashboard__alert-item-code">{item.code}</div>
                        </div>
                        <div className="dashboard__alert-item-stock">
                          <span className={cn(
                            'dashboard__alert-stock-badge',
                            item.currentStock <= 0 ? 'dashboard__alert-stock-badge--critical' : 'dashboard__alert-stock-badge--warning'
                          )}>
                            {item.currentStock <= 0 ? 'HABIS' : 'RENDAH'}
                          </span>
                          <div className="dashboard__alert-stock-detail">
                            {item.currentStock} / {item.minStock} {item.unit}
                          </div>
                        </div>
                        <Link href={`/dashboard/items/${item.id}`} className="dashboard__alert-action">
                          <Search className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
  )
}
