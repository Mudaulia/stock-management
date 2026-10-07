'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { EmptyState, NoData } from '@/components/ui/empty-state'
import { format } from 'date-fns'

interface Transaction {
  id: string
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'
  quantity: number
  transactionDate: Date | string
  item: {
    name: string
    code: string
  }
}

interface RecentTransactionsTableProps {
  transactions: Transaction[]
  className?: string
}

function TransactionTypeBadge({ type }: { type: Transaction['type'] }) {
  const variants = {
    STOCK_IN: { variant: 'success' as const, label: 'Masuk' },
    STOCK_OUT: { variant: 'destructive' as const, label: 'Keluar' },
    ADJUSTMENT: { variant: 'warning' as const, label: 'Penyesuaian' },
  }

  const { variant, label } = variants[type]
  return <Badge variant={variant} className="capitalize">{label}</Badge>
}

function QuantityCell({ quantity, type }: { quantity: number; type: Transaction['type'] }) {
  const prefix = type === 'STOCK_IN' ? '+' : type === 'STOCK_OUT' ? '-' : ''
  const colorClass = type === 'STOCK_IN' ? 'text-emerald-600' : type === 'STOCK_OUT' ? 'text-rose-600' : 'text-muted-foreground'

  return (
    <span className={cn('font-medium tabular-nums', colorClass)}>
      {prefix}{quantity}
    </span>
  )
}

function DateCell({ date }: { date: Date | string }) {
  return (
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {format(new Date(date), 'dd MMM yyyy HH:mm')}
    </span>
  )
}

export function RecentTransactionsTable({ transactions, className }: RecentTransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <NoData
        title="Belum ada transaksi"
        description="Mulai catat pergerakan stok dengan membuat transaksi pertama."
        actionLabel="Buat Transaksi Pertama"
        onAction={() => window.location.href = '/dashboard/stock-in'}
      />
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Barang</TableHead>
            <TableHead className="w-[15%]">Tipe</TableHead>
            <TableHead className="w-[15%] text-right">Jumlah</TableHead>
            <TableHead className="w-[30%]">Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                <div className="font-medium">{tx.item.name}</div>
                <div className="text-xs text-muted-foreground">{tx.item.code}</div>
              </TableCell>
              <TableCell>
                <TransactionTypeBadge type={tx.type} />
              </TableCell>
              <TableCell className="text-right">
                <QuantityCell quantity={tx.quantity} type={tx.type} />
              </TableCell>
              <TableCell>
                <DateCell date={tx.transactionDate} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TableCaption className="p-4 border-t">
        <Link
          href="/dashboard/reports/mutation"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Lihat Semua Transaksi
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </TableCaption>
    </div>
  )
}