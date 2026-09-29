'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Loader2, Calendar, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem, bemVariant } from '@/lib/bem'

const stockInSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type StockInForm = z.infer<typeof stockInSchema>

interface StockTransaction {
  id: string
  itemId: string
  type: string
  quantity: number
  reference: string | null
  notes: string | null
  transactionDate: string
  createdAt: string
  item: {
    id: string
    code: string
    name: string
    unit: string
  }
  createdBy: {
    id: string
    username: string
    fullName: string
  }
}

interface Item {
  id: string
  code: string
  name: string
  unit: string
  currentStock: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function StockInPage() {
  const { showSuccess, showError } = useToast()
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      itemId: '',
      quantity: 1,
      reference: '',
      notes: '',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })
      const res = await fetch(`/api/stock-in?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const json: PaginatedResponse<StockTransaction> = await res.json()
      setTransactions(json.data)
      setPagination(json.pagination)
    } catch (err) {
      showError('Error', 'Gagal memuat data stok masuk')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items?isActive=true&limit=1000')
      if (!res.ok) throw new Error('Gagal memuat barang')
      const json = await res.json()
      setItems(json.data)
    } catch (err) {
      console.error('Fetch items error:', err)
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchItems()
  }, [])

  const onSubmit = async (data: StockInForm) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan')
      showSuccess('Berhasil', 'Stok masuk berhasil dicatat')
      setIsDialogOpen(false)
      reset({ quantity: 1, reference: '', notes: '', transactionDate: format(new Date(), 'yyyy-MM-dd') })
      fetchTransactions()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchTransactions()
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stok Masuk</h1>
          <p className="text-gray-500 mt-1">Catatan barang yang masuk ke gudang</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Stok Masuk
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari barang, referensi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-500">Dari:</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-500">Sampai:</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
            </div>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="stock-in__empty-state">
              <Package className="stock-in__empty-icon" />
              <p className="stock-in__empty-text">Belum ada transaksi stok masuk</p>
              <Button onClick={() => setIsDialogOpen(true)} className="stock-in__empty-button">
                <Plus className="stock-in__empty-button-icon" />
                Tambah Transaksi Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="stock-in__table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--index">#{' '}</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--date">Tanggal</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--item">Barang</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--unit">Satuan</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--quantity stock-in__table-cell--number">Jumlah</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--reference">Referensi</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--notes">Catatan</TableHead>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--created">Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1
                      return (
                        <TableRow key={tx.id} className="stock-in__table-row">
                          <TableCell className="stock-in__table-cell stock-in__table-cell--index">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--date">
                            {format(new Date(tx.transactionDate), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--item">
                            <div className="stock-in__item-name">{tx.item.name}</div>
                            <div className="stock-in__item-code">{tx.item.code}</div>
                          </TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--unit">{tx.item.unit}</TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--quantity stock-in__table-cell--number stock-in__table-cell--quantity-mono">
                            +{tx.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--reference">{tx.reference || '-'}</TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--notes stock-in__table-cell--notes-truncate">{tx.notes || '-'}</TableCell>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--created">{tx.createdBy.fullName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8} className="stock-in__table-footer stock-in__table-footer--pagination">
                        <div className="stock-in__pagination-info">
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                        </div>
                        <div className="stock-in__pagination-controls">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            Selanjutnya
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Stok Masuk</DialogTitle>
            <DialogDescription>Catat barang yang masuk ke gudang</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Barang *</Label>
              <Select onValueChange={(v) => setValue('itemId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih barang" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} - {item.name} (Stok: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && <p className="text-sm text-destructive">{errors.itemId.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  {...register('quantity')}
                />
                {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionDate">Tanggal *</Label>
                <Input
                  id="transactionDate"
                  type="date"
                  {...register('transactionDate')}
                />
                {errors.transactionDate && <p className="text-sm text-destructive">{errors.transactionDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referensi (PO/SO)</Label>
              <Input
                id="reference"
                placeholder="PO-2024-001"
                {...register('reference')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                placeholder="Keterangan tambahan..."
                {...register('notes')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}