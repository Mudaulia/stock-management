'use client'

import { useState, useCallback } from 'react'
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
import { useStockIn, useCreateStockIn, useItems } from '@/hooks/use-api'
import { stockTransactionSchema, itemSchema } from '@/lib/schemas'
import { SkeletonTable } from '@/components/ui/skeleton'
import { useKeyboardNavigation, useRowSelection } from '@/hooks/use-keyboard-navigation'
import { useUnsavedChangesWarning, useFormDirtyTracking } from '@/hooks/use-unsaved-changes'
import { EmptyState, NoData } from '@/components/ui/empty-state'

const stockInSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type StockInForm = z.infer<typeof stockInSchema>

type StockTransaction = z.infer<typeof stockTransactionSchema>
type Item = z.infer<typeof itemSchema>

export default function StockInPage() {
  const { showSuccess, showError } = useToast()
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

  // React Query hooks
  const { data: transactionsData, isLoading, refetch: refetchTransactions } = useStockIn({
    page: pagination.page,
    limit: pagination.limit,
    search,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const { data: itemsData } = useItems({
    isActive: true,
    limit: 1000,
  })

  const createMutation = useCreateStockIn({
    onSuccess: () => {
      showSuccess('Berhasil', 'Stok masuk berhasil dicatat')
      setIsDialogOpen(false)
      reset({ quantity: 1, reference: '', notes: '', transactionDate: format(new Date(), 'yyyy-MM-dd') })
      refetchTransactions()
    },
    onError: (err) => showError('Error', err.message),
  })

  const transactions = transactionsData?.data ?? []
  const paginationData = transactionsData?.pagination
  const items = itemsData?.data ?? []

  // Track form dirty state for unsaved changes warning
  const formValues = watch()
  const initialFormValues = {
    itemId: '',
    quantity: 1,
    reference: '',
    notes: '',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
  }
  const trackedFormValues = {
    itemId: formValues.itemId ?? '',
    quantity: formValues.quantity ?? 1,
    reference: formValues.reference ?? '',
    notes: formValues.notes ?? '',
    transactionDate: formValues.transactionDate ?? format(new Date(), 'yyyy-MM-dd'),
  }
  const isFormDirty = useFormDirtyTracking(initialFormValues, trackedFormValues)

  // Unsaved changes warning for dialog
  const { confirmLeave } = useUnsavedChangesWarning({
    isDirty: isFormDirty && isDialogOpen,
    message: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup dialog ini?',
  })

  const handleDialogClose = async () => {
    const confirmed = await confirmLeave()
    if (confirmed) {
      setIsDialogOpen(false)
    }
  }

  // Keyboard navigation
  const { tableRef, selectedIndex, setSelectedIndex } = useKeyboardNavigation<StockTransaction>({
    rowCount: transactions.length,
    enabled: !isLoading && transactions.length > 0,
  })

  // Row selection for bulk actions
  const { selectedIds, selectedCount, toggleRow, toggleAll, clearSelection, isSelected } = useRowSelection<StockTransaction>()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
  }

  const onSubmit = async (data: StockInForm) => {
    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync(data)
    } catch (err) {
      // Error handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
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
            <SkeletonTable rows={5} columns={7} />
          ) : transactions.length === 0 ? (
            <NoData
              title="Belum ada transaksi stok masuk"
              description="Catat transaksi stok masuk pertama Anda."
              actionLabel="Tambah Transaksi Pertama"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} transaksi terpilih
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Batal
                  </Button>
                </div>
              )}
              <div className="stock-in__table-container" ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="stock-in__table-cell stock-in__table-cell--select w-12">
                        <input
                          type="checkbox"
                          checked={selectedCount === transactions.length && transactions.length > 0}
                          onChange={() => toggleAll(transactions.map(t => t.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
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
                      const rowSelected = isSelected(tx.id)
                      return (
                        <TableRow key={tx.id} className={cn("stock-in__table-row", rowSelected && "bg-primary/5")} onClick={() => toggleRow(tx.id)}>
                          <TableCell className="stock-in__table-cell stock-in__table-cell--select w-12">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(tx.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih transaksi ${tx.id}`}
                            />
                          </TableCell>
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
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, paginationData?.total ?? 0)} dari {paginationData?.total ?? 0}
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
                            disabled={pagination.page === (paginationData?.totalPages ?? 1)}
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
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {isSubmitting || createMutation.isPending ? (
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