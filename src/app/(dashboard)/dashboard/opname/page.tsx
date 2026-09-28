'use client'

import { useState } from 'react'
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
import { Plus, Search, Loader2, Calendar, Package, AlertTriangle, CheckCircle, XCircle, RotateCcw, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toaster } from '@/components/ui/toaster'
import { format } from 'date-fns'

const opnameSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  physicalStock: z.coerce.number().int().nonnegative('Stok fisik tidak boleh negatif'),
  notes: z.string().optional(),
  opnameDate: z.string().min(1, 'Tanggal wajib diisi'),
})

type OpnameForm = z.infer<typeof opnameSchema>

interface StockOpname {
  id: string
  itemId: string
  systemStock: number
  physicalStock: number
  difference: number
  notes: string | null
  status: 'PENDING' | 'RECONCILED' | 'CANCELLED'
  opnameDate: string
  createdAt: string
  item: {
    id: string
    code: string
    name: string
    unit: string
    currentStock: number
  }
  createdBy: {
    id: string
    username: string
    fullName: string
  }
  reconciliation?: {
    id: string
    adjustedAt: string
    adjustedBy: {
      fullName: string
    }
  } | null
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

export default function OpnamePage() {
  const { showSuccess, showError } = useToast()
  const [opnames, setOpnames] = useState<StockOpname[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    resolver: zodResolver(opnameSchema),
    defaultValues: {
      itemId: '',
      physicalStock: 0,
      notes: '',
      opnameDate: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const fetchOpnames = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })
      const res = await fetch(`/api/opname?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const json: PaginatedResponse<StockOpname> = await res.json()
      setOpnames(json.data)
      setPagination(json.pagination)
    } catch (err) {
      showError('Error', 'Gagal memuat data opname')
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

  const onSubmit = async (data: OpnameForm) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan')
      showSuccess('Berhasil', 'Opname berhasil dibuat')
      setIsDialogOpen(false)
      reset({ physicalStock: 0, notes: '', opnameDate: format(new Date(), 'yyyy-MM-dd') })
      fetchOpnames()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReconcile = async () => {
    if (!selectedOpname) return
    setIsReconciling(true)
    try {
      const res = await fetch(`/api/opname/${selectedOpname.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `Direkonsiliasi oleh ${watch('fullName') || 'Admin'}` }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Gagal merekonsiliasi')
      showSuccess('Berhasil', 'Opname berhasil direkonsiliasi')
      setShowReconcileDialog(false)
      setSelectedOpname(null)
      fetchOpnames()
      fetchItems()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Gagal merekonsiliasi')
    } finally {
      setIsReconciling(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedOpname) return
    setIsReconciling(true)
    try {
      const res = await fetch(`/api/opname/${selectedOpname.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Gagal membatalkan')
      showSuccess('Berhasil', 'Opname dibatalkan')
      setShowCancelDialog(false)
      setSelectedOpname(null)
      fetchOpnames()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Gagal membatalkan')
    } finally {
      setIsReconciling(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchOpnames()
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

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stok Opname</h1>
          <p className="text-gray-500 mt-1">Pencatatan stok fisik vs sistem</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Opname Baru
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari barang, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-500">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
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
          ) : opnames.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada data opname</p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Buat Opname Pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead className="text-right">Stok Sistem</TableHead>
                      <TableHead className="text-right">Stok Fisik</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                      <TableHead className="w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opnames.map((op, index) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1
                      return (
                        <TableRow key={op.id}>
                          <TableCell className="text-gray-500">{globalIndex}</TableCell>
                          <TableCell>
                            {format(new Date(op.opnameDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{op.item.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{op.item.code}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{op.systemStock.toLocaleString()} {op.item.unit}</TableCell>
                          <TableCell className="text-right font-mono">{op.physicalStock.toLocaleString()} {op.item.unit}</TableCell>
                          <TableCell className="text-right">{getDifferenceBadge(op.difference)}</TableCell>
                          <TableCell>{getStatusBadge(op.status)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{op.notes || '-'}</TableCell>
                          <TableCell>{op.createdBy.fullName}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOpname(op)
                                  setShowReconcileDialog(true)
                                }}
                                disabled={op.status !== 'PENDING'}
                                title="Rekonsiliasi"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOpname(op)
                                  setShowCancelDialog(true)
                                }}
                                disabled={op.status !== 'PENDING'}
                                title="Batalkan"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOpname(op)
                                  setShowReconcileDialog(true)
                                }}
                                disabled={op.status !== 'RECONCILED'}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={10} className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                        </div>
                        <div className="flex items-center space-x-2">
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
            <DialogTitle>Buat Opname Baru</DialogTitle>
            <DialogDescription>Catat stok fisik barang untuk dibandingkan dengan stok sistem</DialogDescription>
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
                      {item.code} - {item.name} (Stok Sistem: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && <p className="text-sm text-destructive">{errors.itemId.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="physicalStock">Stok Fisik *</Label>
                <Input
                  id="physicalStock"
                  type="number"
                  min="0"
                  {...register('physicalStock')}
                />
                {errors.physicalStock && <p className="text-sm text-destructive">{errors.physicalStock.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="opnameDate">Tanggal Opname *</Label>
                <Input
                  id="opnameDate"
                  type="date"
                  {...register('opnameDate')}
                />
                {errors.opnameDate && <p className="text-sm text-destructive">{errors.opnameDate.message}</p>}
              </div>
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

      {/* Reconcile Confirmation Dialog */}
      <AlertDialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Rekonsiliasi</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOpname ? (
                <>
                  <p>Anda akan merekonsiliasi opname untuk <strong>{selectedOpname.item.name}</strong>.</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Stok Sistem: <strong>{selectedOpname.systemStock} {selectedOpname.item.unit}</strong></p>
                    <p>Stok Fisik: <strong>{selectedOpname.physicalStock} {selectedOpname.item.unit}</strong></p>
                    <p className={cn('font-medium', selectedOpname.difference > 0 ? 'text-green-600' : selectedOpname.difference < 0 ? 'text-red-600' : 'text-gray-600')}>
                      Selisih: {selectedOpname.difference > 0 ? '+' : ''}{selectedOpname.difference} {selectedOpname.item.unit}
                    </p>
                  </div>
                  <p className="mt-2 text-destructive text-sm">
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
            <AlertDialogAction onClick={handleReconcile} disabled={isReconciling}>
              {isReconciling ? (
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Opname</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOpname ? (
                <>
                  <p>Anda akan membatalkan opname untuk <strong>{selectedOpname.item.name}</strong>.</p>
                  <p className="mt-2 text-destructive text-sm">
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
            <AlertDialogAction onClick={handleCancel} disabled={isReconciling}>
              {isReconciling ? (
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