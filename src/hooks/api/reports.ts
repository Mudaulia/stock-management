"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { fetchPaginatedWithSummary, Pagination } from "@/lib/fetch-utils";
import { z } from "zod";
import {
  stockReportItemSchema,
  lowStockReportItemSchema,
  mutationReportItemSchema,
  stockReportSummarySchema,
  lowStockReportSummarySchema,
  mutationSummarySchema,
} from "@/lib/schemas";
import {
  queryKeys,
  buildUrl,
  handleFetchPaginatedWithSummaryResult,
} from "./shared";

export interface UseStockReportParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
  isActive?: boolean | "true" | "false" | "all";
}

export interface StockReportResponse {
  data: z.infer<typeof stockReportItemSchema>[];
  pagination?: Pagination;
  summary?: z.infer<typeof stockReportSummarySchema>;
}

export function useStockReport(
  params: UseStockReportParams = {},
  options?: Omit<
    UseQueryOptions<
      StockReportResponse,
      Error,
      StockReportResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<
    StockReportResponse,
    Error,
    StockReportResponse,
    readonly unknown[]
  >({
    queryKey: queryKeys.reports.stock.list(params as Record<string, unknown>),
    queryFn: async (): Promise<StockReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl("/api/reports/stock", params as Record<string, unknown>),
        stockReportItemSchema,
        stockReportSummarySchema,
      );
      return handleFetchPaginatedWithSummaryResult(result);
    },
    ...options,
  });
}

export interface UseLowStockReportParams {
  page?: number;
  limit?: number;
  search?: string;
  includeZeroStock?: boolean;
}

export interface LowStockReportResponse {
  data: z.infer<typeof lowStockReportItemSchema>[];
  pagination?: Pagination;
  summary?: z.infer<typeof lowStockReportSummarySchema>;
}

export function useLowStockReport(
  params: UseLowStockReportParams = {},
  options?: Omit<
    UseQueryOptions<
      LowStockReportResponse,
      Error,
      LowStockReportResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<
    LowStockReportResponse,
    Error,
    LowStockReportResponse,
    readonly unknown[]
  >({
    queryKey: queryKeys.reports.lowStock.list(
      params as Record<string, unknown>,
    ),
    queryFn: async (): Promise<LowStockReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl("/api/reports/low-stock", params as Record<string, unknown>),
        lowStockReportItemSchema,
        lowStockReportSummarySchema,
      );
      return handleFetchPaginatedWithSummaryResult(result);
    },
    ...options,
  });
}

export interface UseMutationReportParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MutationReportResponse {
  data: z.infer<typeof mutationReportItemSchema>[];
  pagination?: Pagination;
  summary?: z.infer<typeof mutationSummarySchema>;
}

export function useMutationReport(
  params: UseMutationReportParams = {},
  options?: Omit<
    UseQueryOptions<
      MutationReportResponse,
      Error,
      MutationReportResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<
    MutationReportResponse,
    Error,
    MutationReportResponse,
    readonly unknown[]
  >({
    queryKey: queryKeys.reports.mutation.list(
      params as Record<string, unknown>,
    ),
    queryFn: async (): Promise<MutationReportResponse> => {
      const result = await fetchPaginatedWithSummary(
        buildUrl("/api/reports/mutation", params as Record<string, unknown>),
        mutationReportItemSchema,
        mutationSummarySchema,
      );
      return handleFetchPaginatedWithSummaryResult(result);
    },
    ...options,
  });
}
