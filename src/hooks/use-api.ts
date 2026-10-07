'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { fetchPaginated, fetchPaginatedWithSummary, fetchSingle, fetchSummary, FetchResult, Pagination } from '@/lib/fetch-utils'
import { z } from 'zod'
import { itemSchema, stockTransactionSchema, stockOpnameSchema, stockReportItemSchema, lowStockReportItemSchema, mutationReportItemSchema, stockReportSummarySchema, lowStockReportSummarySchema, mutationSummarySchema } from '@/lib/schemas'

// ============================================
// Query Keys Factory
// ============================================

export const queryKeys = {
  items: {
    all: ['items'] as const,
    list: (params?: Record<string, unknown>) => ['items', 'list', params] as const,
    detail: (id: string) => ['items', 'detail', id] as const,
  },
  stockIn: {
    all: ['stock-in'] as const,
    list: (params?: Record<string, unknown>) => ['stock-in', 'list', params] as const,
  },
  stockOut: {
    all: ['stock-out'] as const,
    list: (params?: Record<string, unknown>) => ['stock-out', 'list', params] as const,
  },
  stockAdjustment: {
    all: ['stock-adjustment'] as const,
    list: (params?: Record<string, unknown>) => ['stock-adjustment', 'list', params] as const,
  },
  opname: {
    all: ['opname'] as const,
    list: (params?: Record<string, unknown>) => ['opname', 'list', params] as const,
    detail: (id: string) => ['opname', 'detail', id] as const,
  },
  reports: {
    stock: {
      all: ['reports', 'stock'] as const,
      list: (params?: Record<string, unknown>) => ['reports', 'stock', 'list', params] as const,
    },
    lowStock: {
      all: ['reports', 'low-stock'] as const,
      list: (params?: Record<string, unknown>) => ['reports', 'low-stock', 'list', params] as const,
    },
    mutation: {
      all: ['reports', 'mutation'] as const,
      list: (params?: Record<string, unknown>) => ['reports', 'mutation', 'list', params] as const,
    },
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentTransactions: ['dashboard', 'recent-transactions'] as const,
    lowStockItems: ['dashboard', 'low-stock-items'] as const,
  },
} as const

// Type helper for query key params - use a more permissive type
type QueryKeyParams = Record<string, unknown>

// ============================================
// Generic Query Helpers
// ============================================

function buildUrl(base: string, params?: QueryKeyParams): string {
  if (!params) return base
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `${base}?${query}` : base
}

function handleFetchResult<T>(result: FetchResult<T>): T {
  if (!result.ok) {
    throw new Error(result.message)
  }
  return result.data
}

function handleFetchResultFull<T>(result: FetchResult<T>): { data: T; pagination?: Pagination; summary?: Record<string, unknown> } {
  if (!result.ok) {
    throw new Error(result.message)
  }
  return {
    data: result.data,
    pagination: result.pagination,
    summary: result.summary,
  }
}

// Handle fetchPaginated result which returns { data: T[], pagination?, summary? }
function handleFetchPaginatedResult<T>(result: FetchResult<{ data: T[]; pagination?: Pagination; summary?: Record<string, unknown> }>): { data: T[]; pagination?: Pagination; summary?: Record<string, unknown> } {
  if (!result.ok) {
    throw new Error(result.message)
  }
  return result.data
}

// Handle fetchPaginatedWithSummary result which returns { data: T[], pagination?, summary: S }
function handleFetchPaginatedWithSummaryResult<T, S>(result: FetchResult<{ data: T[]; pagination?: Pagination; summary?: S }>): { data: T[]; pagination?: Pagination; summary?: S } {
  if (!result.ok) {
    throw new Error(result.message)
  }
  return result.data
}

// ============================================
// Items Hooks
// ============================================

export interface UseItemsParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ItemsResponse {
  data: z.infer<typeof itemSchema>[]
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export function useItems(
  params: UseItemsParams = {},
  options?: Omit<UseQueryOptions<ItemsResponse, Error, ItemsResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ItemsResponse, Error, ItemsResponse, readonly unknown[]>({
    queryKey: queryKeys.items.list(params as Record<string, unknown>),
    queryFn: async (): Promise<ItemsResponse> => {
      const result = await fetchPaginated(buildUrl('/api/items', params as Record<string, unknown>), itemSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

export function useItem(id: string, options?: UseQueryOptions<unknown, Error, unknown, readonly unknown[]>) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const result = await fetchSingle(`/api/items/${id}`, z.unknown())
      return handleFetchResult(result)
    },
    enabled: !!id,
    ...options,
  })
}

export function useCreateItem(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to create item')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
    ...options,
  })
}

export function useUpdateItem(
  options?: UseMutationOptions<unknown, Error, { id: string; data: unknown }, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to update item')
      return body
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) })
    },
    ...options,
  })
}

export function useDeleteItem(
  options?: UseMutationOptions<unknown, Error, string, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to delete item')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
    ...options,
  })
}

export function useBulkDeleteItems(
  options?: UseMutationOptions<unknown, Error, string[], unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/items/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to delete items')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
    ...options,
  })
}

export function useExportItems(
  options?: UseMutationOptions<Blob, Error, { ids?: string[]; params?: UseItemsParams }, unknown>
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams()
      if (ids && ids.length > 0) {
        searchParams.append('ids', ids.join(','))
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }
      const response = await fetch(`/api/items/export?${searchParams.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.message || 'Failed to export items')
      }
      return response.blob()
    },
    ...options,
  })
}

export function useExportStockReport(
  options?: UseMutationOptions<Blob, Error, { ids?: string[]; params?: UseStockReportParams }, unknown>
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams()
      if (ids && ids.length > 0) {
        searchParams.append('ids', ids.join(','))
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }
      const response = await fetch(`/api/reports/stock/export?${searchParams.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.message || 'Failed to export stock report')
      }
      return response.blob()
    },
    ...options,
  })
}

export function useExportLowStockReport(
  options?: UseMutationOptions<Blob, Error, { ids?: string[]; params?: UseLowStockReportParams }, unknown>
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams()
      if (ids && ids.length > 0) {
        searchParams.append('ids', ids.join(','))
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }
      const response = await fetch(`/api/reports/low-stock/export?${searchParams.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.message || 'Failed to export low stock report')
      }
      return response.blob()
    },
    ...options,
  })
}

export function useExportMutationReport(
  options?: UseMutationOptions<Blob, Error, { ids?: string[]; params?: UseMutationReportParams }, unknown>
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams()
      if (ids && ids.length > 0) {
        searchParams.append('ids', ids.join(','))
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
          }
        })
      }
      const response = await fetch(`/api/reports/mutation/export?${searchParams.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.message || 'Failed to export mutation report')
      }
      return response.blob()
    },
    ...options,
  })
}

// ============================================
// Stock In Hooks
// ============================================

export interface UseStockInParams {
  page?: number
  limit?: number
  search?: string
  itemId?: string
  startDate?: string
  endDate?: string
}

export interface StockInResponse {
  data: z.infer<typeof stockTransactionSchema>[]
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export function useStockIn(
  params: UseStockInParams = {},
  options?: Omit<UseQueryOptions<StockInResponse, Error, StockInResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StockInResponse, Error, StockInResponse, readonly unknown[]>({
    queryKey: queryKeys.stockIn.list(params as Record<string, unknown>),
    queryFn: async (): Promise<StockInResponse> => {
      const result = await fetchPaginated(buildUrl('/api/stock-in', params as Record<string, unknown>), stockTransactionSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

export function useCreateStockIn(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to create stock in')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockIn.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
    },
    ...options,
  })
}

// ============================================
// Stock Out Hooks
// ============================================

export interface UseStockOutParams {
  page?: number
  limit?: number
  search?: string
  itemId?: string
  startDate?: string
  endDate?: string
}

export interface StockOutResponse {
  data: z.infer<typeof stockTransactionSchema>[]
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export function useStockOut(
  params: UseStockOutParams = {},
  options?: Omit<UseQueryOptions<StockOutResponse, Error, StockOutResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StockOutResponse, Error, StockOutResponse, readonly unknown[]>({
    queryKey: queryKeys.stockOut.list(params as Record<string, unknown>),
    queryFn: async (): Promise<StockOutResponse> => {
      const result = await fetchPaginated(buildUrl('/api/stock-out', params as Record<string, unknown>), stockTransactionSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

export function useCreateStockOut(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to create stock out')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOut.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
    },
    ...options,
  })
}

// ============================================
// Stock Adjustment Hooks
// ============================================

export interface UseStockAdjustmentParams {
  page?: number
  limit?: number
  search?: string
  itemId?: string
  startDate?: string
  endDate?: string
}

export interface StockAdjustmentResponse {
  data: z.infer<typeof stockTransactionSchema>[]
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export function useStockAdjustment(
  params: UseStockAdjustmentParams = {},
  options?: Omit<UseQueryOptions<StockAdjustmentResponse, Error, StockAdjustmentResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StockAdjustmentResponse, Error, StockAdjustmentResponse, readonly unknown[]>({
    queryKey: queryKeys.stockAdjustment.list(params as Record<string, unknown>),
    queryFn: async (): Promise<StockAdjustmentResponse> => {
      const result = await fetchPaginated(buildUrl('/api/stock-adjustment', params as Record<string, unknown>), stockTransactionSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

export function useCreateStockAdjustment(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/stock-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to create stock adjustment')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAdjustment.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
    },
    ...options,
  })
}

// ============================================
// Opname Hooks
// ============================================

export interface UseOpnameParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface OpnameResponse {
  data: z.infer<typeof stockOpnameSchema>[]
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export function useOpname(
  params: UseOpnameParams = {},
  options?: Omit<UseQueryOptions<OpnameResponse, Error, OpnameResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<OpnameResponse, Error, OpnameResponse, readonly unknown[]>({
    queryKey: queryKeys.opname.list(params as Record<string, unknown>),
    queryFn: async (): Promise<OpnameResponse> => {
      const result = await fetchPaginated(buildUrl('/api/opname', params as Record<string, unknown>), stockOpnameSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

export function useOpnameDetail(
  id: string,
  options?: UseQueryOptions<unknown, Error, unknown, readonly unknown[]>
) {
  return useQuery({
    queryKey: queryKeys.opname.detail(id),
    queryFn: async () => {
      const result = await fetchSingle(`/api/opname/${id}`, z.unknown())
      return handleFetchResult(result)
    },
    enabled: !!id,
    ...options,
  })
}

export function useCreateOpname(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to create opname')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
    },
    ...options,
  })
}

export function useReconcileOpname(
  options?: UseMutationOptions<unknown, Error, { id: string; data: unknown }, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/opname/${id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to reconcile opname')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
    },
    ...options,
  })
}

export function useCancelOpname(
  options?: UseMutationOptions<unknown, Error, string, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/opname/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to cancel opname')
      return body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
    },
    ...options,
  })
}

// ============================================
// Reports Hooks
// ============================================

export interface UseStockReportParams {
  page?: number
  limit?: number
  search?: string
  lowStockOnly?: boolean
  isActive?: boolean
}

export interface StockReportResponse {
  data: z.infer<typeof stockReportItemSchema>[]
  pagination?: Pagination
  summary?: z.infer<typeof stockReportSummarySchema>
}

export function useStockReport(
  params: UseStockReportParams = {},
  options?: Omit<UseQueryOptions<StockReportResponse, Error, StockReportResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<StockReportResponse, Error, StockReportResponse, readonly unknown[]>({
    queryKey: queryKeys.reports.stock.list(params as Record<string, unknown>),
    queryFn: async (): Promise<StockReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl('/api/reports/stock', params as Record<string, unknown>),
        stockReportItemSchema,
        stockReportSummarySchema
      )
      return handleFetchPaginatedWithSummaryResult(result)
    },
    ...options,
  })
}

export interface UseLowStockReportParams {
  page?: number
  limit?: number
  search?: string
  includeZeroStock?: boolean
}

export interface LowStockReportResponse {
  data: z.infer<typeof lowStockReportItemSchema>[]
  pagination?: Pagination
  summary?: z.infer<typeof lowStockReportSummarySchema>
}

export function useLowStockReport(
  params: UseLowStockReportParams = {},
  options?: Omit<UseQueryOptions<LowStockReportResponse, Error, LowStockReportResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<LowStockReportResponse, Error, LowStockReportResponse, readonly unknown[]>({
    queryKey: queryKeys.reports.lowStock.list(params as Record<string, unknown>),
    queryFn: async (): Promise<LowStockReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl('/api/reports/low-stock', params as Record<string, unknown>),
        lowStockReportItemSchema,
        lowStockReportSummarySchema
      )
      return handleFetchPaginatedWithSummaryResult(result)
    },
    ...options,
  })
}

export interface UseMutationReportParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  itemId?: string
  startDate?: string
  endDate?: string
}

export interface MutationReportResponse {
  data: z.infer<typeof mutationReportItemSchema>[]
  pagination?: Pagination
  summary?: z.infer<typeof mutationSummarySchema>
}

export function useMutationReport(
  params: UseMutationReportParams = {},
  options?: Omit<UseQueryOptions<MutationReportResponse, Error, MutationReportResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<MutationReportResponse, Error, MutationReportResponse, readonly unknown[]>({
    queryKey: queryKeys.reports.mutation.list(params as Record<string, unknown>),
    queryFn: async (): Promise<MutationReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl('/api/reports/mutation', params as Record<string, unknown>),
        mutationReportItemSchema,
        mutationSummarySchema
      )
      return handleFetchPaginatedWithSummaryResult(result)
    },
    ...options,
  })
}

// ============================================
// Dashboard Hooks
// ============================================

export interface DashboardStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  recentStockIn: number
  recentStockOut: number
  pendingOpnames: number
}

export function useDashboardStats(options?: UseQueryOptions<DashboardStats, Error, DashboardStats, readonly unknown[]>) {
  return useQuery<DashboardStats, Error, DashboardStats, readonly unknown[]>({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to fetch dashboard stats')
      return body.data
    },
    ...options,
  })
}

export interface Transaction {
  id: string
  itemId: string
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'
  quantity: number
  notes: string | null
  transactionDate: string
  createdAt: string
  item: {
    id: string
    name: string
    code: string
  }
}

export function useRecentTransactions(options?: UseQueryOptions<Transaction[], Error, Transaction[], readonly unknown[]>) {
  return useQuery<Transaction[], Error, Transaction[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.recentTransactions,
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-transactions', { credentials: 'include' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to fetch recent transactions')
      return body.data
    },
    ...options,
  })
}

export interface LowStockItem {
  id: string
  code: string
  name: string
  currentStock: number
  minStock: number
  unit: string
}

export function useLowStockItems(options?: UseQueryOptions<LowStockItem[], Error, LowStockItem[], readonly unknown[]>) {
  return useQuery<LowStockItem[], Error, LowStockItem[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.lowStockItems,
    queryFn: async () => {
      const response = await fetch('/api/dashboard/low-stock-items', { credentials: 'include' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to fetch low stock items')
      return body.data
    },
    ...options,
  })
}