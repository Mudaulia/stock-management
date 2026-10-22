'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { Plus, Search, Loader2, Calendar, Package, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem, bemVariant } from '@/lib/bem'
import { useStockOut, useCreateStockOut, useItems } from '@/hooks/use-api'
import { stockTransactionSchema, itemSchema } from '@/lib/schemas'
import { SkeletonTable } from '@/components/ui/skeleton'
import { useKeyboardNavigation, useRowSelection } from '@/hooks/use-keyboard-navigation'
import { useUnsavedChangesWarning, useFormDirtyTracking } from '@/hooks/use-unsaved-changes'
import { EmptyState, NoData } from '@/components/ui/empty-state'
import { useDebounce } from '@/hooks'

const stockOutSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().int().positive('Jumlah harus lebih dari 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type StockOutForm = z.infer<typeof stockOutSchema>

type StockTransaction = z.infer<typeof stockTransactionSchema>
type Item = z.infer<typeof itemSchema>

export default function StockOutPage() {
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Reset ke halaman 1 saat filter berubah (hindari hasil kosong karena masih di halaman akhir)
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch, startDate, endDate])
  const [selectedItemStock, setSelectedItemStock] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      itemId: '',
      quantity: 1,
      reference: '',
      notes: '',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  // React Query hooks
  const { data: transactionsData, isLoading, isError, error, refetch: refetchTransactions } = useStockOut({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const { data: itemsData } = useItems({
    isActive: true,
    limit: 1000,
  })

  const createMutation = useCreateStockOut({
    onSuccess: () => {
      showSuccess('Berhasil', 'Stok keluar berhasil dicatat')
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

  const handleItemChange = (itemId: string) => {
    setValue('itemId', itemId)
    const item = items.find(i => i.id === itemId)
    setSelectedItemStock(item?.currentStock || null)
    // Reset quantity when item changes
    setValue('quantity', 1)
  }

  const onSubmit = async (data: StockOutForm) => {
    // Client-side validation: prevent submitting quantity exceeding available stock
    if (selectedItemStock !== null && data.quantity > selectedItemStock) {
      showError('Error', `Jumlah melebihi stok tersedia (${selectedItemStock})`)
      return
    }

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
          <h1 className="text-3xl font-bold text-gray-900">Stok Keluar</h1>
          <p className="text-gray-500 mt-1">Catatan barang yang keluar dari gudang</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Stok Keluar
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
            <SkeletonTable rows={5} columns={8} />
          ) : isError ? (
            <EmptyState
              title="Gagal memuat data"
              description={error?.message ?? "Terjadi kesalahan saat memuat transaksi. Silakan coba lagi."}
              actionLabel="Coba Lagi"
              onAction={() => refetchTransactions()}
            />
          ) : transactions.length === 0 ? (
            <NoData
              title="Belum ada transaksi stok keluar"
              description="Catat transaksi stok keluar pertama Anda."
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
              <div className="stock-out__table-container" ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--select w-12">
                        <input
                          type="checkbox"
                          checked={selectedCount === transactions.length && transactions.length > 0}
                          onChange={() => toggleAll(transactions.map(t => t.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--index">#{' '}</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--date">Tanggal</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--item">Barang</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--unit">Satuan</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--quantity stock-out__table-cell--number">Jumlah</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--reference">Referensi</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--notes">Catatan</TableHead>
                      <TableHead className="stock-out__table-cell stock-out__table-cell--created">Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1
                      const rowSelected = isSelected(tx.id)
                      return (
                        <TableRow key={tx.id} className={cn("stock-out__table-row", rowSelected && "bg-primary/5")} onClick={() => toggleRow(tx.id)}>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--select w-12">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(tx.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih transaksi ${tx.id}`}
                            />
                          </TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--index">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--date">
                            {format(new Date(tx.transactionDate), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--item">
                            <div className="stock-out__item-name">{tx.item.name}</div>
                            <div className="stock-out__item-code">{tx.item.code}</div>
                          </TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--unit">{tx.item.unit}</TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--quantity stock-out__table-cell--number stock-out__table-cell--quantity-mono">
                            -{tx.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--reference">{tx.reference || '-'}</TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--notes stock-out__table-cell--notes-truncate">{tx.notes || '-'}</TableCell>
                          <TableCell className="stock-out__table-cell stock-out__table-cell--created">{tx.createdBy.fullName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8} className="stock-out__table-footer stock-out__table-footer--pagination">
                        <div className="stock-out__pagination-info">
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, paginationData?.total ?? 0)} dari {paginationData?.total ?? 0}
                        </div>
                        <div className="stock-out__pagination-controls">
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
            <DialogTitle>Tambah Stok Keluar</DialogTitle>
            <DialogDescription>Catat barang yang keluar dari gudang</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Barang *</Label>
              <Select onValueChange={handleItemChange}>
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

            {selectedItemStock !== null && (
              <div className={cn('p-3 rounded-lg text-sm', selectedItemStock <= 0 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700')}>
                <div className="flex items-center gap-2">
                  {selectedItemStock <= 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  <span>
                    Stok tersedia: <strong>{selectedItemStock}</strong> {items.find(i => i.id === watch('itemId'))?.unit || ''}
                    {selectedItemStock <= 0 && ' - STOK HABIS!'}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedItemStock || undefined}
                  {...register('quantity')}
                  className={cn(
                    selectedItemStock !== null && watch('quantity') > selectedItemStock
                      ? 'border-destructive'
                      : ''
                  )}
                />
                {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                {selectedItemStock !== null && selectedItemStock > 0 && (
                  <p className="text-xs text-gray-500">Maksimal: {selectedItemStock}</p>
                )}
                {selectedItemStock !== null && watch('quantity') > selectedItemStock && (
                  <p className="text-xs text-destructive">Jumlah melebihi stok tersedia</p>
                )}
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
              <Label htmlFor="reference">Referensi (SO/PO)</Label>
              <Input
                id="reference"
                placeholder="SO-2024-001"
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
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  selectedItemStock === 0 ||
                  (selectedItemStock !== null && watch('quantity') > selectedItemStock)
                }
              >
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