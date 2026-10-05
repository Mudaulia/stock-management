'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, Minus, ArrowUp, ArrowDown, ClipboardCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  href: string
  label: string
  isCritical?: boolean
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, href, label, isCritical }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card className={cn('transition-all hover:shadow-md', isCritical && 'border-l-4 border-l-red-500')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn('p-2 rounded-lg', iconBg)}>
              <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold tabular-nums">{value.toLocaleString('id-ID')}</div>
            {isCritical && <Badge variant="destructive" className="text-xs">Perlu Tindakan</Badge>}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>{label}</span>
            <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface StatCardsProps {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  recentStockIn: number
  recentStockOut: number
  pendingOpnames: number
}

export function StatCards({
  totalItems,
  lowStockItems,
  outOfStockItems,
  recentStockIn,
  recentStockOut,
  pendingOpnames,
}: StatCardsProps) {
  const stats = [
    {
      title: 'Total Barang',
      value: totalItems,
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/dashboard/items',
      label: 'Kelola Barang',
    },
    {
      title: 'Stok Rendah',
      value: lowStockItems,
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      href: '/dashboard/reports/low-stock',
      label: 'Lihat Detail',
      isCritical: lowStockItems > 0,
    },
    {
      title: 'Stok Habis',
      value: outOfStockItems,
      icon: Minus,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      href: '/dashboard/reports/low-stock?includeZeroStock=true',
      label: 'Lihat Detail',
      isCritical: outOfStockItems > 0,
    },
    {
      title: 'Stok Masuk (7 hari)',
      value: recentStockIn,
      icon: ArrowUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      href: '/dashboard/reports/mutation?type=STOCK_IN',
      label: 'Lihat Mutasi',
    },
    {
      title: 'Stok Keluar (7 hari)',
      value: recentStockOut,
      icon: ArrowDown,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/dashboard/reports/mutation?type=STOCK_OUT',
      label: 'Lihat Mutasi',
    },
    {
      title: 'Opname Pending',
      value: pendingOpnames,
      icon: ClipboardCheck,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/dashboard/opname',
      label: 'Kelola Opname',
      isCritical: pendingOpnames > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}