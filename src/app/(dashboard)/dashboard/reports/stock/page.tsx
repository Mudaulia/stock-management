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
import { Search, Loader2, Package, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem } from '@/lib/bem'

interface StockItem {
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
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK'
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
    totalItems: number
    lowStockCount: number
    outOfStockCount: number
    normalCount: number
  }
}

export default function StockReportPage() {
  const { showSuccess, showError } = useToast()
  const [items, setItems] = useState<StockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState({ totalItems: 0, lowStockCount: 0, outOfStockCount: 0, normalCount: 0 })
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const bemBlock = bem('stock-report')

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
        lowStockOnly: lowStockOnly.toString(),
        isActive: isActive.toString(),
      })
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      const response = await fetch(`/api/reports/stock?${params.toString()}`)
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
  }, [pagination.page, lowStockOnly, isActive, debouncedSearch])

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      NORMAL: 'bg-green-100 text-green-800',
      LOW_STOCK: 'bg-yellow-100 text-yellow-800',
      OUT_OF_STOCK: 'bg-red-100 text-red-800',
    }
    const labels = {
      NORMAL: 'Normal',
      LOW_STOCK: 'Rendah',
      OUT_OF_STOCK: 'Habis',
    }
    const icons = {
      NORMAL: <TrendingUp className="h-3 w-3" />,
      LOW_STOCK: <TrendingDown className="h-3 w-3" />,
      OUT_OF_STOCK: <Minus className="h-3 w-3" />,
    }
    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', variants[status as keyof typeof variants])}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getStockPercentageColor = (percentage: number) => {
    if (percentage <= 0) return 'text-red-600'
    if (percentage <= 50) return 'text-orange-600'
    if (percentage <= 100) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={bemBlock.b()}>
      <Toaster />

      {/* Header */}
      <div className={bemBlock.e('header')}>
        <div className={bemBlock.e('header-content')}>
          <div>
            <h1 className={bemBlock.e('title')}>Laporan Persediaan Stok</h1>
            <p className={bemBlock.e('subtitle')}>Kondisi stok seluruh barang</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={bemBlock.e('summary')}>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><Package className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Total Item</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Normal</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.normalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><TrendingDown className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Stok Rendah</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={bemBlock.e('summary-card')}>
          <CardContent className={bemBlock.e('summary-card-content')}>
            <div className={bemBlock.e('summary-card-row')}>
              <div className={bemBlock.e('summary-card-icon')}><Minus className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className={bemBlock.e('summary-card-label')}>Stok Habis</p>
                <p className={bemBlock.e('summary-card-value')}>{summary.outOfStockCount}</p>
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
              <Label className={bemBlock.e('filters-label')}>Filter</Label>
              <div className={bemBlock.e('filters-checkboxes')}>
                <label className="flex items-center gap-2 cursor-pointer mr-4">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Hanya stok rendah</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Hanya aktif</span>
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
                  <TableHead className={cn('text-right', bemBlock.e('table-header-cell'))}>% dari Min</TableHead>
                  <TableHead className={bemBlock.e('table-header-cell')}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={cn('text-center py-8', bemBlock.e('table-empty'))}>
                      Tidak ada data stok
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
                  <TableCell colSpan={7} className={bemBlock.e('table-footer')}>
                    <div className={bemBlock.e('pagination')}>
                      <div className={bemBlock.e('pagination-info')}>
                        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                      </div>
                      <div className={bemBlock.e('pagination-controls')}>
                        <Select value={pagination.limit.toString()} onValueChange={(v) => handleLimitChange(parseInt(v))}>
                          <SelectTrigger className={cn("w-[100px]", bemBlock.e('pagination-select'))}>
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