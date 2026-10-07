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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, Loader2, Calendar, Package, AlertTriangle, CheckCircle, XCircle, RotateCcw, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem, bemVariant } from '@/lib/bem'
import { useOpname, useCreateOpname, useReconcileOpname, useCancelOpname, useItems } from '@/hooks/use-api'
import { stockOpnameSchema, itemSchema } from '@/lib/schemas'
import { SkeletonTable } from '@/components/ui/skeleton'
import { useKeyboardNavigation, useRowSelection } from '@/hooks/use-keyboard-navigation'
import { useUnsavedChangesWarning, useFormDirtyTracking } from '@/hooks/use-unsaved-changes'
import { EmptyState, NoData } from '@/components/ui/empty-state'

const opnameFormSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  physicalStock: z.coerce.number().int().nonnegative('Stok fisik tidak boleh negatif'),
  notes: z.string().optional(),
  opnameDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type OpnameForm = z.infer<typeof opnameFormSchema>

type StockOpname = z.infer<typeof stockOpnameSchema>
type Item = z.infer<typeof itemSchema>

export default function OpnamePage() {
  const { showSuccess, showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReconciling, setIsReconciling] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null)
  const [showReconcileDialog, setShowReconcileDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OpnameForm>({
    resolver: zodResolver(opnameFormSchema),
    defaultValues: {
      itemId: '',
      physicalStock: 0,
      notes: '',
      opnameDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  // React Query hooks
  const { data: opnamesData, isLoading, refetch: refetchOpnames } = useOpname({
    page: pagination.page,
    limit: pagination.limit,
    search,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const { data: itemsData } = useItems({
    isActive: true,
    limit: 1000,
  })

  const createMutation = useCreateOpname({
    onSuccess: () => {
      showSuccess('Berhasil', 'Opname berhasil dibuat')
      setIsDialogOpen(false)
      reset({ physicalStock: 0, notes: '', opnameDate: format(new Date(), 'yyyy-MM-dd') })
      refetchOpnames()
    },
    onError: (err) => showError('Error', err.message),
  })

  const reconcileMutation = useReconcileOpname({
    onSuccess: () => {
      showSuccess('Berhasil', 'Opname berhasil direkonsiliasi')
      setShowReconcileDialog(false)
      setSelectedOpname(null)
      refetchOpnames()
    },
    onError: (err) => showError('Error', err.message),
  })

  const cancelMutation = useCancelOpname({
    onSuccess: () => {
      showSuccess('Berhasil', 'Opname dibatalkan')
      setShowCancelDialog(false)
      setSelectedOpname(null)
      refetchOpnames()
    },
    onError: (err) => showError('Error', err.message),
  })

  const opnames = opnamesData?.data ?? []
  const paginationData = opnamesData?.pagination
  const items = itemsData?.data ?? []

  // Track form dirty state for unsaved changes warning
  const formValues = watch()
  const initialFormValues = {
    itemId: '',
    physicalStock: 0,
    notes: '',
    opnameDate: format(new Date(), 'yyyy-MM-dd'),
  }
  const trackedFormValues = {
    itemId: formValues.itemId ?? '',
    physicalStock: formValues.physicalStock ?? 0,
    notes: formValues.notes ?? '',
    opnameDate: formValues.opnameDate ?? format(new Date(), 'yyyy-MM-dd'),
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
  const { tableRef, selectedIndex, setSelectedIndex } = useKeyboardNavigation<StockOpname>({
    rowCount: opnames.length,
    enabled: !isLoading && opnames.length > 0,
  })

  // Row selection for bulk actions
  const { selectedIds, selectedCount, toggleRow, toggleAll, clearSelection, isSelected } = useRowSelection<StockOpname>()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
  }

  const handleReconcile = async () => {
    if (!selectedOpname) return
    setIsReconciling(true)
    try {
      await reconcileMutation.mutateAsync({ id: selectedOpname.id, data: {} })
    } catch (err) {
      // Error handled by mutation onError
    } finally {
      setIsReconciling(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedOpname) return
    setIsReconciling(true)
    try {
      await cancelMutation.mutateAsync(selectedOpname.id)
    } catch (err) {
      // Error handled by mutation onError
    } finally {
      setIsReconciling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      RECONCILED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    const labels = {
      PENDING: 'Pending',
      RECONCILED: 'Direkonsiliasi',
      CANCELLED: 'Dibatalkan',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getDifferenceBadge = (diff: number) => {
    if (diff > 0) return <span className="text-green-600 font-mono font-medium">+{diff}</span>
    if (diff < 0) return <span className="text-red-600 font-mono font-medium">{diff}</span>
    return <span className="text-gray-500 font-mono">0</span>
  }

  const bemBlock = bem('opname')

  const onSubmit = async (data: OpnameForm) => {
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
    <div className={bemBlock.b()}>
      <Toaster />

      {/* Header & Actions */}
      <div className={bemBlock.e('header')}>
        <div>
          <h1 className={bemBlock.e('title')}>Stok Opname</h1>
          <p className={bemBlock.e('subtitle')}>Pencatatan stok fisik vs sistem</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Opname Baru
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className={bemBlock.e('filter-card')}>
          <form onSubmit={handleSearch} className={bemBlock.e('filter-form')}>
            <div className={bemBlock.e('search-input-wrapper')}>
              <Search className={bemBlock.e('search-icon')} />
              <Input
                placeholder="Cari barang, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={bemBlock.e('search-input')}
              />
            </div>
            <div className={bemBlock.e('filter-group')}>
              <Label className={bemBlock.e('filter-label')}>Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={bemBlock.e('filter-select')}>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RECONCILED">Direkonsiliasi</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={bemBlock.e('filter-group')}>
              <Label className={bemBlock.e('filter-label')}>Dari:</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={bemBlock.e('filter-date')} />
            </div>
            <div className={bemBlock.e('filter-group')}>
              <Label className={bemBlock.e('filter-label')}>Sampai:</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={bemBlock.e('filter-date')} />
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
        <CardContent className={bemBlock.e('table-card')}>
          {isLoading ? (
            <SkeletonTable rows={5} columns={9} />
          ) : opnames.length === 0 ? (
            <NoData
              title="Belum ada data opname"
              description="Buat opname pertama Anda untuk memulai pencatatan stok fisik."
              actionLabel="Buat Opname Pertama"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCount} opname terpilih
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Batal
                  </Button>
                </div>
              )}
              <div className={bemBlock.e('table-container')} ref={tableRef} tabIndex={0}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={bemBlock.e('table-header-cell', 'index')}>#</TableHead>
                      <TableHead className={cn(bemBlock.e('table-header-cell', 'select'), 'w-12')}>
                        <input
                          type="checkbox"
                          checked={selectedCount === opnames.length && opnames.length > 0}
                          onChange={() => toggleAll(opnames.map(o => o.id))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          aria-label="Pilih semua"
                        />
                      </TableHead>
                      <TableHead className={bemBlock.e('table-header-cell', 'date')}>Tanggal</TableHead>
                      <TableHead className={bemBlock.e('table-header-cell', 'item')}>Barang</TableHead>
                      <TableHead className={cn(bemBlock.e('table-header-cell', 'system-stock'), 'text-right')}>Stok Sistem</TableHead>
                      <TableHead className={cn(bemBlock.e('table-header-cell', 'physical-stock'), 'text-right')}>Stok Fisik</TableHead>
                      <TableHead className={cn(bemBlock.e('table-header-cell', 'difference'), 'text-right')}>Selisih</TableHead>
                      <TableHead className={bemBlock.e('table-header-cell', 'status')}>Status</TableHead>
                      <TableHead className={bemBlock.e('table-header-cell', 'notes')}>Catatan</TableHead>
                      <TableHead className={bemBlock.e('table-header-cell', 'created-by')}>Dibuat Oleh</TableHead>
                      <TableHead className={cn(bemBlock.e('table-header-cell', 'actions'), 'w-32')}>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opnames.map((op, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1
                      const rowSelected = isSelected(op.id)
                      return (
                        <TableRow key={op.id} className={cn(rowSelected && "bg-primary/5")} onClick={() => toggleRow(op.id)}>
                          <TableCell className={bemBlock.e('table-cell', 'index')}>{globalIndex}</TableCell>
                          <TableCell className={cn(bemBlock.e('table-cell', 'select'), 'w-12')}>
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              onChange={(e) => { e.stopPropagation(); toggleRow(op.id); }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              aria-label={`Pilih opname ${op.id}`}
                            />
                          </TableCell>
                          <TableCell className={bemBlock.e('table-cell', 'date')}>
                            {format(new Date(op.opnameDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className={bemBlock.e('table-cell', 'item')}>
                            <div className={bemBlock.e('item-name')}>{op.item.name}</div>
                            <div className={bemBlock.e('item-code')}>{op.item.code}</div>
                          </TableCell>
                          <TableCell className={cn(bemBlock.e('table-cell', 'system-stock'), 'text-right', 'font-mono')}>{op.systemStock.toLocaleString()} {op.item.unit}</TableCell>
                          <TableCell className={cn(bemBlock.e('table-cell', 'physical-stock'), 'text-right', 'font-mono')}>{op.physicalStock.toLocaleString()} {op.item.unit}</TableCell>
                          <TableCell className={cn(bemBlock.e('table-cell', 'difference'), 'text-right')}>{getDifferenceBadge(op.difference)}</TableCell>
                          <TableCell className={bemBlock.e('table-cell', 'status')}>{getStatusBadge(op.status)}</TableCell>
                          <TableCell className={cn(bemBlock.e('table-cell', 'notes'), 'max-w-[200px]', 'truncate')}>{op.notes || '-'}</TableCell>
                          <TableCell className={bemBlock.e('table-cell', 'created-by')}>{op.createdBy.fullName}</TableCell>
                          <TableCell>
                            <div className={bemBlock.e('actions')}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setSelectedOpname(op); setShowReconcileDialog(true); }}
                                disabled={op.status !== 'PENDING'}
                                title="Rekonsiliasi"
                              >
                                <CheckCircle className={bemBlock.e('action-icon', 'reconcile')} />
                              </Button>
                              {op.status === 'PENDING' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); setSelectedOpname(op); setShowCancelDialog(true); }}
                                  title="Batalkan"
                                >
                                  <Trash2 className={bemBlock.e('action-icon', 'cancel')} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setSelectedOpname(op); setShowReconcileDialog(true); }}
                                disabled={op.status !== 'RECONCILED'}
                                title="Lihat Detail"
                              >
                                <Eye className={bemBlock.e('action-icon', 'view')} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={10} className={cn(bemBlock.e('table-footer'), 'flex', 'items-center', 'justify-between')}>
                        <div className={bemBlock.e('pagination-info')}>
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, paginationData?.total ?? 0)} dari {paginationData?.total ?? 0}
                        </div>
                        <div className={bemBlock.e('pagination-controls')}>
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
        <DialogContent className={bemBlock.e('dialog', 'sm:max-w-[500px]')}>
          <DialogHeader>
            <DialogTitle className={bemBlock.e('dialog-title')}>Buat Opname Baru</DialogTitle>
            <DialogDescription className={bemBlock.e('dialog-description')}>Catat stok fisik barang untuk dibandingkan dengan stok sistem</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className={bemBlock.e('dialog-form')}>
            <div className={bemBlock.e('form-group')}>
              <Label htmlFor="itemId" className={bemBlock.e('form-label')}>Barang *</Label>
              <Select onValueChange={(v: string) => setValue('itemId', v)}>
                <SelectTrigger className={bemBlock.e('form-select')}>
                  <SelectValue placeholder="Pilih barang" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} - {item.name} (Stok Sistem: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && <p className={bemBlock.e('error-message')}>{errors.itemId.message}</p>}
            </div>
            <div className={bemBlock.e('form-grid')}>
              <div className={bemBlock.e('form-group')}>
                <Label htmlFor="physicalStock" className={bemBlock.e('form-label')}>Stok Fisik *</Label>
                <Input
                  id="physicalStock"
                  type="number"
                  min="0"
                  {...register('physicalStock')}
                />
                {errors.physicalStock && <p className={bemBlock.e('error-message')}>{errors.physicalStock.message}</p>}
              </div>
              <div className={bemBlock.e('form-group')}>
                <Label htmlFor="opnameDate" className={bemBlock.e('form-label')}>Tanggal Opname *</Label>
                <Input
                  id="opnameDate"
                  type="date"
                  {...register('opnameDate')}
                />
                {errors.opnameDate && <p className={bemBlock.e('error-message')}>{errors.opnameDate.message}</p>}
              </div>
            </div>
            <div className={bemBlock.e('form-group')}>
              <Label htmlFor="notes" className={bemBlock.e('form-label')}>Catatan</Label>
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

      {/* Reconcile Confirmation Dialog */}
      <AlertDialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <AlertDialogContent className={bemBlock.e('dialog', 'alert-dialog')}>
          <AlertDialogHeader>
            <AlertDialogTitle className={bemBlock.e('dialog-title')}>Konfirmasi Rekonsiliasi</AlertDialogTitle>
            <AlertDialogDescription className={bemBlock.e('dialog-description')}>
              {selectedOpname ? (
                <>
                  <p>Anda akan merekonsiliasi opname untuk <strong>{selectedOpname.item.name}</strong>.</p>
                  <div className={bemBlock.e('reconcile-info')}>
                    <p>Stok Sistem: <strong>{selectedOpname.systemStock} {selectedOpname.item.unit}</strong></p>
                    <p>Stok Fisik: <strong>{selectedOpname.physicalStock} {selectedOpname.item.unit}</strong></p>
                    <p className={bemBlock.e('difference-value', selectedOpname.difference > 0 ? 'text-green-600' : selectedOpname.difference < 0 ? 'text-red-600' : 'text-gray-600')}>
                      Selisih: {selectedOpname.difference > 0 ? '+' : ''}{selectedOpname.difference} {selectedOpname.item.unit}
                    </p>
                  </div>
                  <p className={bemBlock.e('warning-text')}>
                    Tindakan ini akan mengubah stok sistem menjadi stok fisik dan membuat transaksi penyesuaian. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </>
              ) : (
                'Memuat data...'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReconcile} disabled={isReconciling || reconcileMutation.isPending}>
              {isReconciling || reconcileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Rekonsiliasi'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className={bemBlock.e('dialog', 'alert-dialog')}>
          <AlertDialogHeader>
            <AlertDialogTitle className={bemBlock.e('dialog-title')}>Batalkan Opname</AlertDialogTitle>
            <AlertDialogDescription className={bemBlock.e('dialog-description')}>
              {selectedOpname ? (
                <>
                  <p>Anda akan membatalkan opname untuk <strong>{selectedOpname.item.name}</strong>.</p>
                  <p className={bemBlock.e('warning-text')}>
                    Data opname akan ditandai sebagai dibatalkan dan tidak dapat direkonsiliasi.
                  </p>
                </>
              ) : (
                'Memuat data...'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isReconciling || cancelMutation.isPending}>
              {isReconciling || cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Batalkan Opname'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}