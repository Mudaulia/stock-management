'use client'

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
import { Loader2 } from 'lucide-react'
import { bem } from '@/lib/bem'
import type { StockOpname } from './types'

interface ReconcileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opname: StockOpname | null
  isPending: boolean
  onConfirm: () => void
}

export function ReconcileDialog({
  open,
  onOpenChange,
  opname,
  isPending,
  onConfirm,
}: ReconcileDialogProps) {
  const bemBlock = bem('opname')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Rekonsiliasi</AlertDialogTitle>
          <AlertDialogDescription>
            {opname ? (
              <>
                Rekonsiliasi opname untuk <strong>{opname.item.name}</strong>?
                <br />
                Stok sistem: <strong>{opname.systemStock}</strong> → Stok fisik: <strong>{opname.physicalStock}</strong>
                <br />
                Selisih: <strong>{opname.difference}</strong>
                <p className={bemBlock.e('warning-text')}>
                  Tindakan ini akan mengubah stok sistem menjadi stok fisik dan tidak dapat dibatalkan.
                </p>
              </>
            ) : (
              'Memuat data...'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Ya, Rekonsiliasi'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
