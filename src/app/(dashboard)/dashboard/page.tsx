import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import DashboardLayout from './layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowUp, ArrowDown, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <DashboardLayout userRole={user?.role || 'VIEWER'}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {user?.fullName || 'User'}! Berikut ringkasan stok Anda.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                <stat.icon className={cn('h-4 w-4', stat.color)} aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
              <p className="text-center text-gray-500 py-8">Belum ada transaksi</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Barang</th>
                      <th className="pb-3 font-medium">Tipe</th>
                      <th className="pb-3 font-medium">Jumlah</th>
                      <th className="pb-3 font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="py-3 text-sm">
                          <div className="font-medium">{tx.item.name}</div>
                          <div className="text-xs text-gray-500">{tx.item.code}</div>
                        </td>
                        <td className="py-3 text-sm">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            tx.type === 'STOCK_IN' ? 'bg-green-100 text-green-800' :
                            tx.type === 'STOCK_OUT' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          )}>
                            {tx.type === 'STOCK_IN' ? 'Masuk' : tx.type === 'STOCK_OUT' ? 'Keluar' : 'Penyesuaian'}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-medium">
                          {tx.type === 'STOCK_IN' ? '+' : tx.type === 'STOCK_OUT' ? '-' : ''}{tx.quantity}
                        </td>
                        <td className="py-3 text-sm text-gray-500">
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
  )
}