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

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opname: StockOpname | null
  isPending: boolean
  onConfirm: () => void
}

export function CancelDialog({
  open,
  onOpenChange,
  opname,
  isPending,
  onConfirm,
}: CancelDialogProps) {
  const bemBlock = bem('opname')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan Opname?</AlertDialogTitle>
          <AlertDialogDescription>
            {opname ? (
              <>
                <p>Anda akan membatalkan opname untuk <strong>{opname.item.name}</strong>.</p>
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
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? (
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
  )
}
