'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Loader2 } from 'lucide-react'
import { bem } from '@/lib/bem'
import type { Item, OpnameForm } from './types'

interface CreateOpnameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<OpnameForm>
  items: Item[]
  isSubmitting: boolean
  isPending: boolean
  onSubmit: (data: OpnameForm) => Promise<void>
}

export function CreateOpnameDialog({
  open,
  onOpenChange,
  form,
  items,
  isSubmitting,
  isPending,
  onSubmit,
}: CreateOpnameDialogProps) {
  const {
    register,
    formState: { errors },
    setValue,
  } = form
  const bemBlock = bem('opname')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={bemBlock.e('dialog', 'sm:max-w-[500px]')}>
        <DialogHeader>
          <DialogTitle className={bemBlock.e('dialog-title')}>Buat Opname Baru</DialogTitle>
          <DialogDescription className={bemBlock.e('dialog-description')}>Catat stok fisik barang untuk dibandingkan dengan stok sistem</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className={bemBlock.e('dialog-form')}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? (
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
  )
}
