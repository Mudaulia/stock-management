'use client'

import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Loader2, Package, Download, Filter, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem } from '@/lib/bem'
import { fetchPaginated } from '@/lib/fetch-utils'
import { stockTransactionSchema } from '@/lib/schemas'

type MutationTransaction = z.infer<typeof stockTransactionSchema>

export default function MutationReportPage() {
  const { showSuccess, showError } = useToast()
  const [transactions, setTransactions] = useState<MutationTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState<Record<string, { totalQuantity: number; transactionCount: number }>>({})
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [itemId, setItemId] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const bemBlock = bem('mutation-report')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(typeFilter && { type: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(itemId && { itemId }),
      })
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      const url = `/api/reports/mutation?${params.toString()}`
      console.log('Fetching:', url)
      const result = await fetchPaginated<MutationTransaction>(
        url,
        stockTransactionSchema
      )
      console.log('Result:', result)

      if (!result.ok) {
        console.error('API Error:', result.message, result.errors)
        throw new Error(result.message || 'Gagal memuat data')
      }

      console.log('Setting data:', result.data)
      setTransactions(result.data)
      setPagination(prev => ({ ...prev, ...result.pagination }))
      setSummary(result.summary as Record<string, { totalQuantity: number; transactionCount: number }>)
    } catch (err) {
      console.error('Fetch error:', err)
      showError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
}, [pagination.page, pagination.limit, typeFilter, startDate, endDate, itemId, debouncedSearch, showError]);

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      STOCK_IN: 'bg-green-100 text-green-800',
      STOCK_OUT: 'bg-red-100 text-red-800',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      STOCK_IN: 'Masuk',
      STOCK_OUT: 'Keluar',
      ADJUSTMENT: 'Penyesuaian',
    }
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[type as keyof typeof variants])}>
        {labels[type as keyof typeof labels]}
      </span>
    )
  }

  const getQuantityDisplay = (type: string, quantity: number) => {
    if (type === 'STOCK_IN') return `+${quantity}`
    if (type === 'STOCK_OUT') return `-${quantity}`
    return quantity > 0 ? `+${quantity}` : `${quantity}`
  }

  const getQuantityColor = (type: string) => {
    if (type === 'STOCK_IN') return 'text-green-600'
    if (type === 'STOCK_OUT') return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className={bemBlock.b()}>
      <Toaster />

      {/* Header */}
      <div className={bemBlock.e('header')}>
        <div className={bemBlock.e('header-content')}>
          <div>
            <h1 className={bemBlock.e('title')}>Laporan Mutasi Stok</h1>
            <p className={bemBlock.e('subtitle')}>Riwayat pergerakan stok barang (masuk, keluar, penyesuaian)</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={bemBlock.e('summary')}>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Transaksi</p>
                <p className={bemBlock.e('summary-card-value')}>
                  {Object.values(summary).reduce((acc, curr) => acc + curr.transactionCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}>
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Stok Masuk</p>
                <p className={bemBlock.e('summary-card-value')}>
                  {summary.STOCK_IN?.totalQuantity || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}>
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Stok Keluar</p>
                <p className={bemBlock.e('summary-card-value')}>
                  {summary.STOCK_OUT?.totalQuantity || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}>
                <Filter className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Penyesuaian</p>
                <p className={bemBlock.e('summary-card-value')}>
                  {summary.ADJUSTMENT?.totalQuantity || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={bemBlock.e('filters')}>
        <CardContent className={bemBlock.e('filters-content')}>
          <div className={bemBlock.e('filters-row')}>
            <div className={bemBlock.e('filters-search')}>
              <Label htmlFor="search" className={bemBlock.e('filters-label')}>
                Cari
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Kode, nama, referensi, catatan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className={bemBlock.e('filters-type')}>
              <Label htmlFor="type" className={bemBlock.e('filters-label')}>
                Tipe
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className={bemBlock.e('filters-select')}>
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua tipe</SelectItem>
                  <SelectItem value="STOCK_IN">Stok Masuk</SelectItem>
                  <SelectItem value="STOCK_OUT">Stok Keluar</SelectItem>
                  <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={bemBlock.e('filters-date')}>
              <Label htmlFor="startDate" className={bemBlock.e('filters-label')}>
                Dari Tanggal
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className={bemBlock.e('filters-date')}>
              <Label htmlFor="endDate" className={bemBlock.e('filters-label')}>
                Sampai Tanggal
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className={bemBlock.e('table-card')}>
        <CardContent className={bemBlock.e('table-content')}>
          <div className={bemBlock.e('table-wrapper')}>
            <Table>
              <TableHeader>
                <TableRow className={bemBlock.e('table-row--header')}>
                  <TableHead className={bemBlock.e('table-cell--header')}>Barang</TableHead>
                  <TableHead className={bemBlock.e('table-cell--header')}>Tipe</TableHead>
                  <TableHead className={cn(bemBlock.e('table-cell--header'), 'text-right')}>Jumlah</TableHead>
                  <TableHead className={bemBlock.e('table-cell--header')}>Referensi</TableHead>
                  <TableHead className={bemBlock.e('table-cell--header')}>Catatan</TableHead>
                  <TableHead className={bemBlock.e('table-cell--header')}>Tanggal</TableHead>
                  <TableHead className={bemBlock.e('table-cell--header')}>Dibuat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={bemBlock.e('table-body')}>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className={cn(bemBlock.e('table-cell'), 'text-center py-8')}>
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={cn(bemBlock.e('table-cell'), 'text-center py-8')}>
                      <p className={bemBlock.e('empty-state')}>Tidak ada data mutasi stok</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map(tx => (
                    <TableRow key={tx.id} className={bemBlock.e('table-row--hover')}>
                      <TableCell className={bemBlock.e('table-cell')}>
                        <div className={bemBlock.e('item-name')}>{tx.item.name}</div>
                        <div className={bemBlock.e('item-code')}>{tx.item.code}</div>
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {getTypeBadge(tx.type)}
                      </TableCell>
                      <TableCell className={cn(bemBlock.e('table-cell'), 'text-right', getQuantityColor(tx.type))}>
                        {getQuantityDisplay(tx.type, tx.quantity)} {tx.item.unit}
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {tx.reference || '-'}
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {tx.notes || '-'}
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {format(new Date(tx.transactionDate), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {tx.createdBy.fullName}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className={bemBlock.e('table-footer')}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className={bemBlock.e('pagination-info')}>
                        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                      </div>
                      <div className={bemBlock.e('pagination-controls')}>
                        <Select value={pagination.limit.toString()} onValueChange={v => handleLimitChange(parseInt(v))}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 per halaman</SelectItem>
                            <SelectItem value="25">25 per halaman</SelectItem>
                            <SelectItem value="50">50 per halaman</SelectItem>
                            <SelectItem value="100">100 per halaman</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                          >
                            Sebelumnya
                          </Button>
                          <span className={bemBlock.e('page-indicator')}>
                            Halaman {pagination.page} dari {pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                          >
                            Selanjutnya
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}