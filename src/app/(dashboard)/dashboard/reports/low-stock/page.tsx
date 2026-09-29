'use client'

import { useState, useEffect } from 'react'
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
import { Search, Loader2, AlertTriangle, Package, Download, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem } from '@/lib/bem'

interface LowStockItem {
  id: string
  code: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  stockStatus: 'LOW_STOCK' | 'OUT_OF_STOCK'
  shortage: number
  stockPercentage: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalLowStock: number
    totalOutOfStock: number
    totalItems: number
  }
}

export default function LowStockReportPage() {
  const { showSuccess, showError } = useToast()
  const [items, setItems] = useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState({ totalLowStock: 0, totalOutOfStock: 0, totalItems: 0 })
  const [search, setSearch] = useState('')
  const [includeZeroStock, setIncludeZeroStock] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const bemBlock = bem('low-stock-report')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        includeZeroStock: includeZeroStock.toString(),
      })
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      const response = await fetch(`/api/reports/low-stock?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memuat data')
      }

      setItems(result.data)
      setPagination(prev => ({ ...prev, ...result.pagination }))
      setSummary(result.summary)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [pagination.page, includeZeroStock, debouncedSearch])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      OUT_OF_STOCK: 'bg-red-100 text-red-800',
      LOW_STOCK: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      OUT_OF_STOCK: 'Habis',
      LOW_STOCK: 'Rendah',
    }
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[status as keyof typeof variants])}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getStockPercentageColor = (percentage: number) => {
    if (percentage <= 0) return 'text-red-600'
    if (percentage <= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className={bemBlock.b()}>
      <Toaster />

      {/* Header */}
      <div className={bemBlock.e('header')}>
        <div className={bemBlock.e('header-content')}>
          <div>
            <h1 className={bemBlock.e('title')}>Laporan Stok Minimum</h1>
            <p className={bemBlock.e('subtitle')}>Barang dengan stok di bawah atau sama dengan batas minimum</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={bemBlock.e('summary')}>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Stok Rendah</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.totalLowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><Package className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Stok Habis</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.totalOutOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><Filter className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Item</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.totalItems}</p>
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
              <Label htmlFor="search" className={bemBlock.e('filters-label')}>Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari kode atau nama barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn('pl-10', bemBlock.e('filters-input'))}
                />
              </div>
            </div>
            <div className={bemBlock.e('filters-options')}>
              <Label className={bemBlock.e('filters-label')}>Opsi</Label>
              <div className={bemBlock.e('filters-checkbox')}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeZeroStock}
                    onChange={(e) => setIncludeZeroStock(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Sertakan stok 0</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <div className={bemBlock.e('table-container')}>
            <Table>
              <TableHeader>
                <TableRow className={bemBlock.e('table-header-row')}>
                  <TableHead className={bemBlock.e('table-header-cell')}>Kode</TableHead>
                  <TableHead className={bemBlock.e('table-header-cell')}>Nama Barang</TableHead>
                  <TableHead className={bemBlock.e('table-header-cell')}>Satuan</TableHead>
                  <TableHead className={cn('text-right', bemBlock.e('table-header-cell'))}>Stok Saat Ini</TableHead>
                  <TableHead className={cn('text-right', bemBlock.e('table-header-cell'))}>Stok Minimum</TableHead>
                  <TableHead className={cn('text-right', bemBlock.e('table-header-cell'))}>Kekurangan</TableHead>
                  <TableHead className={cn('text-right', bemBlock.e('table-header-cell'))}>% dari Min</TableHead>
                  <TableHead className={bemBlock.e('table-header-cell')}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className={cn('text-center py-8', bemBlock.e('table-empty'))}>
                      Tidak ada data stok minimum
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className={bemBlock.e('table-row')}>
                      <TableCell className={cn('font-mono text-sm', bemBlock.e('table-cell'))}>{item.code}</TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        <div className={bemBlock.e('item-name')}>{item.name}</div>
                        {item.description && (
                          <div className={cn('text-xs text-muted-foreground', bemBlock.e('item-description'))}>
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>{item.unit}</TableCell>
                      <TableCell className={cn('text-right font-mono font-medium', bemBlock.e('table-cell'))}>
                        {item.currentStock.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', bemBlock.e('table-cell'))}>
                        {item.minStock.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono font-medium text-red-600', bemBlock.e('table-cell'))}>
                        {item.shortage.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono font-medium', bemBlock.e('table-cell'))}>
                        <span className={getStockPercentageColor(item.stockPercentage)}>
                          {item.stockPercentage}%
                        </span>
                      </TableCell>
                      <TableCell className={bemBlock.e('table-cell')}>
                        {getStatusBadge(item.stockStatus)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className={bemBlock.e('table-footer')}>
                    <div className={bemBlock.e('pagination')}>
                      <div className={bemBlock.e('pagination-info')}>
                        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                      </div>
                      <div className={bemBlock.e('pagination-controls')}>
                        <Select value={pagination.limit.toString()} onValueChange={(v) => handleLimitChange(parseInt(v))} className={bemBlock.e('pagination-select')}>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className={bemBlock.e('pagination-btn')}
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className={bemBlock.e('pagination-btn')}
                        >
                          Selanjutnya
                        </Button>
                        <span className={cn('flex items-center px-2 text-sm text-muted-foreground', bemBlock.e('pagination-page'))}>
                          Halaman {pagination.page} dari {pagination.totalPages || 1}
                        </span>
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