import { z } from "zod";
import { itemSchema } from "@/lib/schemas";
import { UNIT_OPTIONS } from "@/lib/constants";

export type Item = z.infer<typeof itemSchema>;

/**
 * Form schema untuk create/edit item (client-side validation).
 * Mirrors the server-side itemCreateSchema in /api/items/route.ts.
 *
 * Do NOT use the response schema (itemSchema) here — it requires
 * server-generated fields (id, isActive, timestamps) that forms
 * never provide, and inputs submit numeric fields as strings.
 */
export const itemFormSchema = z.object({
  code: z.string().min(1, "Kode barang wajib diisi").max(50),
  name: z.string().min(1, "Nama barang wajib diisi").max(255),
  unit: z.enum(UNIT_OPTIONS),
  minStock: z.coerce
    .number({ invalid_type_error: "Stok minimum harus berupa angka" })
    .int("Stok minimum harus bilangan bulat")
    .min(0, "Stok minimum tidak boleh negatif"),
  currentStock: z.coerce
    .number({ invalid_type_error: "Stok awal harus berupa angka" })
    .int("Stok awal harus bilangan bulat")
    .min(0, "Stok awal tidak boleh negatif"),
  description: z.string().optional(),
});

export type ItemForm = z.infer<typeof itemFormSchema>;
