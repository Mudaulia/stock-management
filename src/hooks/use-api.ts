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
    all: ['reports'] as const,
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
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(variables.id) })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export function useBulkDeleteItems(
  options?: UseMutationOptions<unknown, Error, string[], unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Endpoint yang benar: DELETE /api/items dengan body { ids }
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Failed to delete items')
      return body
    },
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockIn.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOut.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAdjustment.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTransactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.lowStockItems })
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
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
  isActive?: boolean | 'true' | 'false' | 'all'
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

const dashboardStatsSchema = z.object({
  totalItems: z.number(),
  lowStockItems: z.number(),
  outOfStockItems: z.number(),
  recentStockIn: z.number(),
  recentStockOut: z.number(),
  pendingOpnames: z.number(),
})

export function useDashboardStats(options?: UseQueryOptions<DashboardStats, Error, DashboardStats, readonly unknown[]>) {
  return useQuery<DashboardStats, Error, DashboardStats, readonly unknown[]>({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const result = await fetchSingle<DashboardStats>('/api/dashboard/stats', dashboardStatsSchema)
      return handleFetchResult(result)
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

const recentTransactionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: z.number(),
  notes: z.string().nullable(),
  transactionDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  item: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }),
})

export function useRecentTransactions(options?: UseQueryOptions<Transaction[], Error, Transaction[], readonly unknown[]>) {
  return useQuery<Transaction[], Error, Transaction[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.recentTransactions,
    queryFn: async () => {
      const result = await fetchSingle<Transaction[]>('/api/dashboard/recent-transactions', z.array(recentTransactionSchema))
      return handleFetchResult(result)
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

const lowStockItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  currentStock: z.number(),
  minStock: z.number(),
  unit: z.string(),
})

export function useLowStockItems(options?: UseQueryOptions<LowStockItem[], Error, LowStockItem[], readonly unknown[]>) {
  return useQuery<LowStockItem[], Error, LowStockItem[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.lowStockItems,
    queryFn: async () => {
      const result = await fetchSingle<LowStockItem[]>('/api/dashboard/low-stock-items', z.array(lowStockItemSchema))
      return handleFetchResult(result)
    },
    ...options,
  })
}

// ============================================
// Users Hooks (US-13/US-14 — ADMIN only)
// ============================================

export interface UseUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: 'ADMIN' | 'WAREHOUSE_STAFF' | 'VIEWER'
  isActive?: boolean
}

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  fullName: z.string(),
  role: z.enum(['ADMIN', 'WAREHOUSE_STAFF', 'VIEWER']),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type UserRow = z.infer<typeof userSchema>

export interface UsersResponse {
  data: UserRow[]
  pagination?: Pagination
}

export function useUsers(
  params: UseUsersParams = {},
  options?: Omit<UseQueryOptions<UsersResponse, Error, UsersResponse, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<UsersResponse, Error, UsersResponse, readonly unknown[]>({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: async (): Promise<UsersResponse> => {
      const result = await fetchPaginated(buildUrl('/api/users', params as Record<string, unknown>), userSchema)
      return handleFetchPaginatedResult(result)
    },
    ...options,
  })
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
}

export function useCreateUser(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Gagal menambahkan pengguna')
      return body
    },
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUsers(queryClient)
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export function useUpdateUser(
  options?: UseMutationOptions<unknown, Error, { id: string; data: unknown }, unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Gagal memperbarui pengguna')
      return body
    },
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUsers(queryClient)
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}