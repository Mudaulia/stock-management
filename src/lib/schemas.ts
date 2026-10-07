import { z } from 'zod'

/**
 * Zod schemas for all data types used across the frontend.
 *
 * These schemas are used with `fetchWithZod` / `fetchPaginated` / `fetchSingle`
 * to validate API responses at runtime, ensuring type safety and providing
 * structured error information when the response shape doesn't match expectations.
 */

// ─── Auth ────────────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  fullName: z.string(),
  role: z.enum(['ADMIN', 'WAREHOUSE_STAFF', 'VIEWER']),
})

export const loginResponseSchema = z.object({
  user: userSchema,
})

// ─── Items ───────────────────────────────────────────────────────────────

export const itemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  minStock: z.number().int(),
  currentStock: z.number().int(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const itemWithStockStatusSchema = itemSchema.extend({
  stockStatus: z.enum(['NORMAL', 'LOW_STOCK', 'OUT_OF_STOCK']),
  stockPercentage: z.number(),
})

export const itemWithShortageSchema = itemSchema.extend({
  stockStatus: z.enum(['LOW_STOCK', 'OUT_OF_STOCK']),
  shortage: z.number(),
  stockPercentage: z.number(),
})

// ─── Stock Transactions ──────────────────────────────────────────────────

export const transactionTypeSchema = z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'])

export const transactionItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  currentStock: z.number().int().optional(),
})

export const transactionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
})

export const stockTransactionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: transactionTypeSchema,
  quantity: z.number().int(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  transactionDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  item: transactionItemSchema,
  createdBy: transactionUserSchema,
})

export const stockTransactionWithItemStockSchema = stockTransactionSchema.extend({
  item: transactionItemSchema.extend({
    currentStock: z.number().int(),
  }),
})

// ─── Stock Opname ────────────────────────────────────────────────────────

export const opnameStatusSchema = z.enum(['PENDING', 'RECONCILED', 'CANCELLED'])

export const opnameItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  currentStock: z.number().int(),
})

export const reconciliationSchema = z.object({
  id: z.string(),
  adjustedAt: z.string().datetime(),
  adjustedBy: z.object({
    fullName: z.string(),
  }),
})

export const stockOpnameSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  systemStock: z.number().int(),
  physicalStock: z.number().int(),
  difference: z.number().int(),
  notes: z.string().nullable(),
  status: opnameStatusSchema,
  opnameDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  item: opnameItemSchema,
  createdBy: transactionUserSchema,
  reconciliation: reconciliationSchema.nullable().optional(),
})

// ─── Summary Schemas ─────────────────────────────────────────────────────

export const stockReportSummarySchema = z.object({
  totalItems: z.number().int(),
  lowStockCount: z.number().int(),
  outOfStockCount: z.number().int(),
  normalCount: z.number().int(),
})

export const lowStockReportSummarySchema = z.object({
  totalLowStock: z.number().int(),
  totalOutOfStock: z.number().int(),
  totalItems: z.number().int(),
})

export const mutationSummarySchema = z.record(
  z.object({
    totalQuantity: z.number().int(),
    transactionCount: z.number().int(),
  })
)

// ─── Report Item Schemas ─────────────────────────────────────────────────

export const stockReportItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  currentStock: z.number().int(),
  minStock: z.number().int(),
  stockPercentage: z.number(),
  stockStatus: z.enum(['NORMAL', 'LOW_STOCK', 'OUT_OF_STOCK']),
  isActive: z.boolean(),
})

export const lowStockReportItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  currentStock: z.number().int(),
  minStock: z.number().int(),
  shortage: z.number().int(),
  stockPercentage: z.number(),
  stockStatus: z.enum(['LOW_STOCK', 'OUT_OF_STOCK']),
})

export const mutationReportItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: transactionTypeSchema,
  quantity: z.number().int(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  transactionDate: z.string().datetime(),
  item: transactionItemSchema,
  createdBy: transactionUserSchema,
})
