"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { fetchPaginated, Pagination } from "@/lib/fetch-utils";
import { z } from "zod";
import { stockTransactionSchema } from "@/lib/schemas";
import {
  queryKeys,
  buildUrl,
  handleFetchPaginatedResult,
  mutateJson,
} from "./shared";

interface TransactionListParams {
  page?: number;
  limit?: number;
  search?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

interface TransactionListResponse {
  data: z.infer<typeof stockTransactionSchema>[];
  pagination?: Pagination;
  summary?: Record<string, unknown>;
}

function useTransactionList(
  key: readonly unknown[],
  endpoint: string,
  params: TransactionListParams,
  options?: Omit<
    UseQueryOptions<
      TransactionListResponse,
      Error,
      TransactionListResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<
    TransactionListResponse,
    Error,
    TransactionListResponse,
    readonly unknown[]
  >({
    queryKey: key,
    queryFn: async (): Promise<TransactionListResponse> => {
      const result = await fetchPaginated(
        buildUrl(endpoint, params as Record<string, unknown>),
        stockTransactionSchema,
      );
      return handleFetchPaginatedResult(result);
    },
    ...options,
  });
}

function invalidateTransactionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  domainKey: readonly unknown[],
) {
  queryClient.invalidateQueries({ queryKey: domainKey });
  queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.recentTransactions,
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.lowStockItems,
  });
}

// ============================================
// Stock In
// ============================================

export type UseStockInParams = TransactionListParams;
export type StockInResponse = TransactionListResponse;

export function useStockIn(
  params: UseStockInParams = {},
  options?: Omit<
    UseQueryOptions<
      StockInResponse,
      Error,
      StockInResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useTransactionList(
    queryKeys.stockIn.list(params as Record<string, unknown>),
    "/api/stock-in",
    params,
    options,
  );
}

export function useCreateStockIn(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson("/api/stock-in", "POST", data, "Failed to create stock in"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateTransactionCaches(queryClient, queryKeys.stockIn.all);
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

// ============================================
// Stock Out
// ============================================

export type UseStockOutParams = TransactionListParams;
export type StockOutResponse = TransactionListResponse;

export function useStockOut(
  params: UseStockOutParams = {},
  options?: Omit<
    UseQueryOptions<
      StockOutResponse,
      Error,
      StockOutResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useTransactionList(
    queryKeys.stockOut.list(params as Record<string, unknown>),
    "/api/stock-out",
    params,
    options,
  );
}

export function useCreateStockOut(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson("/api/stock-out", "POST", data, "Failed to create stock out"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateTransactionCaches(queryClient, queryKeys.stockOut.all);
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

// ============================================
// Stock Adjustment
// ============================================

export type UseStockAdjustmentParams = TransactionListParams;
export type StockAdjustmentResponse = TransactionListResponse;

export function useStockAdjustment(
  params: UseStockAdjustmentParams = {},
  options?: Omit<
    UseQueryOptions<
      StockAdjustmentResponse,
      Error,
      StockAdjustmentResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useTransactionList(
    queryKeys.stockAdjustment.list(params as Record<string, unknown>),
    "/api/stock-adjustment",
    params,
    options,
  );
}

export function useCreateStockAdjustment(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson(
        "/api/stock-adjustment",
        "POST",
        data,
        "Failed to create stock adjustment",
      ),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateTransactionCaches(queryClient, queryKeys.stockAdjustment.all);
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
