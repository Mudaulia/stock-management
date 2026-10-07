'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, ExternalLink, Package } from 'lucide-react'
import Link from 'next/link'
import { EmptyState, NoData } from '@/components/ui/empty-state'

interface LowStockItem {
  id: string
  code: string
  name: string
  currentStock: number
  minStock: number
  unit: string
}

interface LowStockAlertProps {
  items: LowStockItem[]
  className?: string
}

function StockProgressBar({ current, min }: { current: number; min: number }) {
  const percentage = min > 0 ? Math.min((current / min) * 100, 100) : 0
  const isCritical = current <= 0

  return (
    <div className="w-full">
      <Progress
        value={percentage}
        className={cn('h-2', isCritical && 'bg-red-100')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isCritical ? 'bg-red-500' : percentage < 50 ? 'bg-yellow-500' : 'bg-emerald-500'
          )}
        />
      </Progress>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{current} {current === 1 ? 'unit' : 'units'}</span>
        <span>Min: {min}</span>
      </div>
    </div>
  )
}

function StatusBadge({ current, min }: { current: number; min: number }) {
  if (current <= 0) {
    return <Badge variant="destructive" className="text-xs font-medium">HABIS</Badge>
  }
  if (current <= min) {
    return <Badge variant="warning" className="text-xs font-medium">RENDAH</Badge>
  }
  return <Badge variant="success" className="text-xs font-medium">AMAN</Badge>
}

export function LowStockAlert({ items, className }: LowStockAlertProps) {
  if (items.length === 0) {
    return (
      <Card className={cn('border-emerald-200 bg-emerald-50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Package className="h-5 w-5" />
            Stok Aman
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <NoData
            title="Semua stok dalam kondisi baik"
            description="Tidak ada barang dengan stok di bawah minimum"
            icon={<Package className="h-12 w-12 text-emerald-400" />}
          />
        </CardContent>
      </Card>
    )
  }

  const criticalItems = items.filter((item) => item.currentStock <= 0)
  const warningItems = items.filter((item) => item.currentStock > 0 && item.currentStock <= item.minStock)

  return (
    <Card className={cn('border-yellow-200 bg-yellow-50', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Perhatian: Stok Rendah
          </CardTitle>
          <Link
            href="/dashboard/reports/low-stock"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-700 hover:underline"
          >
            Lihat Semua
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {criticalItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                Stok Habis ({criticalItems.length})
              </h4>
              <div className="space-y-3">
                {criticalItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/items/${item.id}`}
                    className="block p-3 rounded-lg bg-white border border-red-100 hover:border-red-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge current={item.currentStock} min={item.minStock} />
                        <StockProgressBar current={item.currentStock} min={item.minStock} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {warningItems.length > 0 && (
            <div className={cn('pt-4 border-t border-yellow-200', criticalItems.length > 0 && 'mt-4')}>
              <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2">
                Stok Rendah ({warningItems.length})
              </h4>
              <div className="space-y-3">
                {warningItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/items/${item.id}`}
                    className="block p-3 rounded-lg bg-white border border-yellow-100 hover:border-yellow-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge current={item.currentStock} min={item.minStock} />
                        <StockProgressBar current={item.currentStock} min={item.minStock} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}