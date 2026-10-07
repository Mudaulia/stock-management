'use client'

import { StatCards } from './components/StatCards'
import { ActionButtons } from './components/ActionButtons'
import { RecentTransactionsTable } from './components/RecentTransactionsTable'
import { LowStockAlert } from './components/LowStockAlert'
import { Plus, ArrowUp, ArrowDown, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { useDashboardStats, useRecentTransactions, useLowStockItems } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions()
  const { data: lowStockItems, isLoading: lowStockLoading } = useLowStockItems()

  if (authLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
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
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <StatCards
          totalItems={stats?.totalItems ?? 0}
          lowStockItems={stats?.lowStockItems ?? 0}
          outOfStockItems={stats?.outOfStockItems ?? 0}
          recentStockIn={stats?.recentStockIn ?? 0}
          recentStockOut={stats?.recentStockOut ?? 0}
          pendingOpnames={stats?.pendingOpnames ?? 0}
        />
      )}

      {/* Two Column Layout: Recent Transactions + Low Stock Alert */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Transactions - 8 cols on lg */}
        <div className="lg:col-span-8">
          {transactionsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <RecentTransactionsTable transactions={recentTransactions ?? []} />
          )}
        </div>

        {/* Low Stock Alert - 4 cols on lg */}
        <div className="lg:col-span-4">
          {lowStockLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <LowStockAlert items={lowStockItems ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
