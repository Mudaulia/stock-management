'use client'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { CheckCircle, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bem } from '@/lib/bem'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState, NoData } from '@/components/ui/empty-state'
import type { StockOpname } from './types'

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface OpnameTableProps {
  opnames: StockOpname[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  onOpenCreate: () => void
  selectedCount: number
  clearSelection: () => void
  tableRef: React.RefObject<HTMLDivElement>
  toggleAll: (ids: string[]) => void
  toggleRow: (id: string) => void
  isSelected: (id: string) => boolean
  pagination: PaginationState
  setPagination: (pagination: PaginationState) => void
  paginationData?: { total: number; totalPages: number }
  onSelectReconcile: (opname: StockOpname) => void
  onSelectCancel: (opname: StockOpname) => void
}

const statusBadges: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RECONCILED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  RECONCILED: 'Direkonsiliasi',
  CANCELLED: 'Dibatalkan',
}

function getStatusBadge(status: string) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadges[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  )
}

function getDifferenceBadge(diff: number) {
  if (diff > 0) return <span className="text-green-600 font-mono font-medium">+{diff}</span>
  if (diff < 0) return <span className="text-red-600 font-mono font-medium">{diff}</span>
  return <span className="text-gray-500 font-mono">0</span>
}

export function OpnameTable({
  opnames,
  isLoading,
  isError,
  error,
  onRetry,
  onOpenCreate,
  selectedCount,
  clearSelection,
  tableRef,
  toggleAll,
  toggleRow,
  isSelected,
  pagination,
  setPagination,
  paginationData,
  onSelectReconcile,
  onSelectCancel,
}: OpnameTableProps) {
  const bemBlock = bem('opname')

  if (isLoading) {
    return <SkeletonTable rows={5} columns={9} />
  }

  if (isError) {
    return (
      <EmptyState
        title="Gagal memuat data"
        description={error?.message ?? 'Terjadi kesalahan saat memuat data opname. Silakan coba lagi.'}
        actionLabel="Coba Lagi"
        onAction={onRetry}
      />
    )
  }

  if (opnames.length === 0) {
    return (
      <NoData
        title="Belum ada data opname"
        description="Buat opname pertama Anda untuk memulai pencatatan stok fisik."
        actionLabel="Buat Opname Pertama"
        onAction={onOpenCreate}
      />
    )
  }

  return (
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
                        onClick={(e) => { e.stopPropagation(); onSelectReconcile(op); }}
                        disabled={op.status !== 'PENDING'}
                        title="Rekonsiliasi"
                      >
                        <CheckCircle className={bemBlock.e('action-icon', 'reconcile')} />
                      </Button>
                      {op.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); onSelectCancel(op); }}
                          title="Batalkan"
                        >
                          <Trash2 className={bemBlock.e('action-icon', 'cancel')} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); onSelectReconcile(op); }}
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
  )
}
