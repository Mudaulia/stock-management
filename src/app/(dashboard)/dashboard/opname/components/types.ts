import { z } from 'zod'
import { stockOpnameSchema, itemSchema } from '@/lib/schemas'

export const opnameFormSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  physicalStock: z.coerce.number().int().nonnegative('Stok fisik tidak boleh negatif'),
  notes: z.string().optional(),
  opnameDate: z.string().min(1, 'Tanggal wajib diisi'),
})

export type OpnameForm = z.infer<typeof opnameFormSchema>

export type StockOpname = z.infer<typeof stockOpnameSchema>
export type Item = z.infer<typeof itemSchema>
