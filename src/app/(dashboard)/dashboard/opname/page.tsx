'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Calendar, Package } from 'lucide-react'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'
import { bem } from '@/lib/bem'
import { useOpname, useCreateOpname, useReconcileOpname, useCancelOpname, useItems } from '@/hooks/use-api'
import { useKeyboardNavigation, useRowSelection } from '@/hooks/use-keyboard-navigation'
import { useUnsavedChangesWarning, useFormDirtyTracking } from '@/hooks/use-unsaved-changes'
import { useDebounce } from '@/hooks'
import { CreateOpnameDialog } from './components/create-opname-dialog'
import { ReconcileDialog } from './components/reconcile-dialog'
import { CancelDialog } from './components/cancel-dialog'
import { OpnameTable } from './components/opname-table'
import { opnameFormSchema, type OpnameForm, type StockOpname } from './components/types'

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

  const form = useForm<OpnameForm>({
    resolver: zodResolver(opnameFormSchema),
    defaultValues: {
      itemId: '',
      physicalStock: 0,
      notes: '',
      opnameDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  // Data fetching
  const debouncedSearch = useDebounce(search, 300)
  const { data: opnamesData, isLoading: isLoadingOpnames, isError: isErrorOpnames, error: opnamesError, refetch: refetchOpnames } = useOpname({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    status: statusFilter,
    startDate,
    endDate,
  })
  const { data: itemsData, isLoading: isLoadingItems } = useItems()

  const createMutation = useCreateOpname()
  const reconcileMutation = useReconcileOpname()
  const cancelMutation = useCancelOpname()

  const opnames: StockOpname[] = opnamesData?.data ?? []
  const paginationData = opnamesData?.pagination
  const items = itemsData?.data ?? []

  // Row selection
  const { selectedCount, clearSelection, toggleAll, toggleRow, isSelected } = useRowSelection<{ id: string }>()

  // Keyboard navigation
  const { tableRef } = useKeyboardNavigation<StockOpname>({ rowCount: opnames.length })

  // Track form dirty state for unsaved changes warning
  const formValues = form.watch()
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
  useUnsavedChangesWarning({
    isDirty: isFormDirty && isDialogOpen,
    message: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup dialog ini?',
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      form.reset({
        itemId: '',
        physicalStock: 0,
        notes: '',
        opnameDate: format(new Date(), 'yyyy-MM-dd'),
      })
    }
  }, [isDialogOpen, form])

  // Handlers
  const handleOpenCreate = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const handleCreateSubmit = useCallback(
    async (data: OpnameForm) => {
      setIsSubmitting(true)
      try {
        await createMutation.mutateAsync({
          itemId: data.itemId,
          physicalStock: data.physicalStock,
          notes: data.notes,
          opnameDate: data.opnameDate,
        })
        showSuccess('Opname berhasil dibuat')
        setIsDialogOpen(false)
        clearSelection()
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Gagal membuat opname')
      } finally {
        setIsSubmitting(false)
      }
    },
    [createMutation, showSuccess, showError, clearSelection],
  )

  const handleSelectReconcile = useCallback((opname: StockOpname) => {
    setSelectedOpname(opname)
    setShowReconcileDialog(true)
  }, [])

  const handleSelectCancel = useCallback((opname: StockOpname) => {
    setSelectedOpname(opname)
    setShowCancelDialog(true)
  }, [])

  const handleReconcile = useCallback(async () => {
    if (!selectedOpname) return
    setIsReconciling(true)
    try {
      await reconcileMutation.mutateAsync({ id: selectedOpname.id, data: {} })
      showSuccess('Rekonsiliasi berhasil')
      setShowReconcileDialog(false)
      setSelectedOpname(null)
      clearSelection()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal melakukan rekonsiliasi')
    } finally {
      setIsReconciling(false)
    }
  }, [selectedOpname, reconcileMutation, showSuccess, showError, clearSelection])

  const handleCancel = useCallback(async () => {
    if (!selectedOpname) return
    try {
      await cancelMutation.mutateAsync(selectedOpname.id)
      showSuccess('Opname berhasil dibatalkan')
      setShowCancelDialog(false)
      setSelectedOpname(null)
      clearSelection()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal membatalkan opname')
    }
  }, [selectedOpname, cancelMutation, showSuccess, showError, clearSelection])

  const bemBlock = bem('opname')

  return (
    <div className={bemBlock.b()}>
      <Toaster />
      {/* Header */}
      <div className={bemBlock.e('header')}>
        <div>
          <h1 className={bemBlock.e('title')}>Stock Opname</h1>
          <p className={bemBlock.e('subtitle')}>Bandingkan stok fisik dengan stok sistem dan lakukan rekonsiliasi</p>
        </div>
        <Button onClick={handleOpenCreate} className={bemBlock.e('create-button')}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Opname Baru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={bemBlock.e('filters')}>
            <div className={bemBlock.e('filter-item', 'search')}>
              <Search className={bemBlock.e('filter-icon')} />
              <Input
                placeholder="Cari barang atau catatan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                className={bemBlock.e('filter-input')}
              />
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className={bemBlock.e('filter-date')}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className={bemBlock.e('filter-date')}
            />
            <Button
              variant="outline"
              onClick={() => { setSearch(''); setStatusFilter(''); setStartDate(''); setEndDate(''); setPagination(p => ({ ...p, page: 1 })) }}
              className={bemBlock.e('filter-reset')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <OpnameTable
        opnames={opnames}
        isLoading={isLoadingOpnames || isLoadingItems}
        isError={isErrorOpnames}
        error={opnamesError instanceof Error ? opnamesError : null}
        onRetry={() => { void refetchOpnames() }}
        onOpenCreate={handleOpenCreate}
        selectedCount={selectedCount}
        clearSelection={clearSelection}
        tableRef={tableRef}
        toggleAll={toggleAll}
        toggleRow={toggleRow}
        isSelected={isSelected}
        pagination={pagination}
        setPagination={setPagination}
        paginationData={paginationData}
        onSelectReconcile={handleSelectReconcile}
        onSelectCancel={handleSelectCancel}
      />

      {/* Create Dialog */}
      <CreateOpnameDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        form={form}
        items={items}
        isSubmitting={isSubmitting}
        isPending={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />

      {/* Reconcile Dialog */}
      <ReconcileDialog
        open={showReconcileDialog}
        onOpenChange={setShowReconcileDialog}
        opname={selectedOpname}
        isPending={isReconciling || reconcileMutation.isPending}
        onConfirm={() => { void handleReconcile() }}
      />

      {/* Cancel Dialog */}
      <CancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        opname={selectedOpname}
        isPending={isReconciling || cancelMutation.isPending}
        onConfirm={() => { void handleCancel() }}
      />
    </div>
  )
}
