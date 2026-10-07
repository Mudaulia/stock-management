'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { useStockAdjustment, useCreateStockAdjustment, useItems } from '@/hooks/use-api'
import { stockTransactionSchema, itemSchema } from '@/lib/schemas'
import { SkeletonTable } from '@/components/ui/skeleton'
import { useKeyboardNavigation, useRowSelection } from '@/hooks/use-keyboard-navigation'
import { useUnsavedChangesWarning, useFormDirtyTracking } from '@/hooks/use-unsaved-changes'
import { EmptyState, NoData } from '@/components/ui/empty-state'

const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().int().refine(val => val !== 0, 'Jumlah tidak boleh nol'),
  reference: z.string().max(100).optional(),
  notes: z.string().min(1, 'Catatan wajib diisi untuk penyesuaian manual'),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>
type StockTransaction = z.infer<typeof stockTransactionSchema>
type Item = z.infer<typeof itemSchema>

export default function StockAdjustmentPage() {
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedItemStock, setSelectedItemStock] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      itemId: '',
      quantity: 1,
      reference: '',
      notes: '',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  // React Query hooks
  const { data: transactionsData, isLoading, refetch: refetchTransactions } = useStockAdjustment({
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

  const createMutation = useCreateStockAdjustment({
    onSuccess: () => {
      showSuccess('Berhasil', 'Penyesuaian stok berhasil dicatat')
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
    setValue('quantity', 1)
  }

  const onSubmit = async (data: StockAdjustmentForm) => {
    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync(data)
    } catch (err) {
      // Error handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
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

  const getQuantityDisplay = (type: string, quantity: number, notes?: string | null) => {
    if (type === 'ADJUSTMENT') {
      const isIncrease = notes?.includes('INCREASE') || quantity > 0
      return isIncrease ? `+${quantity}` : `-${quantity}`
    }
    if (type === 'STOCK_IN') return `+${quantity}`
    if (type === 'STOCK_OUT') return `-${quantity}`
    return quantity > 0 ? `+${quantity}` : `${quantity}`
  }

  const getQuantityColor = (type: string, notes?: string | null) => {
    if (type === 'ADJUSTMENT') {
      const isIncrease = notes?.includes('INCREASE') || true
      return isIncrease ? 'text-green-600' : 'text-red-600'
    }
    if (type === 'STOCK_IN') return 'text-green-600'
    if (type === 'STOCK_OUT') return 'text-red-600'
    return 'text-yellow-600'
  }

  const bemBlock = bem('stock-adjustment')

  return (
    <div className={bemBlock.b()}>
      <Toaster />

      <div className={bemBlock.e('header')}>
        <div>
          <h1 className={bemBlock.e('title')}>Penyesuaian Stok</h1>
          <p className={bemBlock.e('subtitle')}>Catatan penyesuaian stok manual (tambah/kurang)</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Penyesuaian
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari barang, referensi, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 w-[160px]"
                  placeholder="Dari tanggal"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 w-[160px]"
                  placeholder="Sampai tanggal"
                />
              </div>
              <Button type="submit" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : transactions.length === 0 ? (
            <NoData
              title="Belum ada data penyesuaian stok"
              description="Buat penyesuaian stok pertama Anda."
              actionLabel="Buat Penyesuaian Pertama"
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
              <div className="overflow-x-auto" ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]">#</TableHead>
                      <TableHead className="w-[5%]">
                        <input
                          type="checkbox"
                          checked={selectedCount === transactions.length && transactions.length > 0}
                          onChange={() => toggleAll(transactions.map(t => t.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead className="w-[15%]">Tanggal</TableHead>
                      <TableHead className="w-[25%]">Barang</TableHead>
                      <TableHead className="w-[12%]">Tipe</TableHead>
                      <TableHead className="w-[12%] text-right">Jumlah</TableHead>
                      <TableHead className="w-[15%]">Referensi</TableHead>
                      <TableHead className="w-[18%]">Catatan</TableHead>
                      <TableHead className="w-[10%]">Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1
                      const isAdjustment = tx.type === 'ADJUSTMENT'
                      const isIncrease = isAdjustment && tx.notes?.includes('INCREASE')
                      const rowSelected = isSelected(tx.id)
                      return (
                        <TableRow key={tx.id} className={cn("hover:bg-muted/50 transition-colors", rowSelected && "bg-primary/5")} onClick={() => toggleRow(tx.id)}>
                          <TableCell className="text-sm text-muted-foreground">{globalIndex}</TableCell>
                          <TableCell className="text-sm text-muted-foreground w-[5%]">
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(tx.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih transaksi ${tx.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(new Date(tx.transactionDate), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{tx.item.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">{tx.item.code}</div>
                          </TableCell>
                          <TableCell>{getTypeBadge(tx.type)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            <span className={cn(getQuantityColor(tx.type, tx.notes))}>
                              {isAdjustment ? (isIncrease ? '+' : '-') : tx.type === 'STOCK_IN' ? '+' : '-'}
                              {tx.quantity.toLocaleString()} {tx.item.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{tx.reference || '-'}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{tx.notes || '-'}</TableCell>
                          <TableCell className="text-sm">{tx.createdBy.fullName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={8} className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Menampilkan{" "}
                          {(pagination.page - 1) * pagination.limit + 1} -{" "}
                          {Math.min(
                            pagination.page * pagination.limit,
                            paginationData?.total ?? 0,
                          )}{" "}
                          dari {paginationData?.total ?? 0}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page - 1,
                              })
                            }
                            disabled={pagination.page === 1}
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page + 1,
                              })
                            }
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Penyesuaian Stok</DialogTitle>
            <DialogDescription>
              Sesuaikan stok barang secara manual. Gunakan angka positif untuk menambah, negatif untuk mengurangi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">Barang *</Label>
              <Select onValueChange={(v: string) => setValue('itemId', v)}>
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
                  step="1"
                  {...register('quantity')}
                />
                {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Positif = tambah stok, Negatif = kurangi stok
                </p>
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
              <Label htmlFor="reference">Referensi</Label>
              <Input
                id="reference"
                placeholder="Nomor referensi (opsional)"
                {...register('reference')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan *</Label>
              <Input
                id="notes"
                placeholder="Alasan penyesuaian (wajib diisi)..."
                {...register('notes')}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
            </div>
            {selectedItemStock !== null && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span>Stok saat ini: </span>
                <span className="font-mono font-medium">{selectedItemStock}</span>
              </div>
            )}
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