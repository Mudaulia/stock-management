"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { fetchSingle } from "@/lib/fetch-utils";
import { z } from "zod";
import { queryKeys, handleFetchResult } from "./shared";

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentStockIn: number;
  recentStockOut: number;
  pendingOpnames: number;
}

const dashboardStatsSchema = z.object({
  totalItems: z.number(),
  lowStockItems: z.number(),
  outOfStockItems: z.number(),
  recentStockIn: z.number(),
  recentStockOut: z.number(),
  pendingOpnames: z.number(),
});

export function useDashboardStats(
  options?: UseQueryOptions<
    DashboardStats,
    Error,
    DashboardStats,
    readonly unknown[]
  >,
) {
  return useQuery<DashboardStats, Error, DashboardStats, readonly unknown[]>({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const result = await fetchSingle<DashboardStats>(
        "/api/dashboard/stats",
        dashboardStatsSchema,
      );
      return handleFetchResult(result);
    },
    ...options,
  });
}

export interface Transaction {
  id: string;
  itemId: string;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  quantity: number;
  notes: string | null;
  transactionDate: string;
  createdAt: string;
  item: {
    id: string;
    name: string;
    code: string;
  };
}

const recentTransactionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.number(),
  notes: z.string().nullable(),
  transactionDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  item: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }),
});

export function useRecentTransactions(
  options?: UseQueryOptions<
    Transaction[],
    Error,
    Transaction[],
    readonly unknown[]
  >,
) {
  return useQuery<Transaction[], Error, Transaction[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.recentTransactions,
    queryFn: async () => {
      const result = await fetchSingle<Transaction[]>(
        "/api/dashboard/recent-transactions",
        z.array(recentTransactionSchema),
      );
      return handleFetchResult(result);
    },
    ...options,
  });
}

export interface LowStockItem {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

const lowStockItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  currentStock: z.number(),
  minStock: z.number(),
  unit: z.string(),
});

export function useLowStockItems(
  options?: UseQueryOptions<
    LowStockItem[],
    Error,
    LowStockItem[],
    readonly unknown[]
  >,
) {
  return useQuery<LowStockItem[], Error, LowStockItem[], readonly unknown[]>({
    queryKey: queryKeys.dashboard.lowStockItems,
    queryFn: async () => {
      const result = await fetchSingle<LowStockItem[]>(
        "/api/dashboard/low-stock-items",
        z.array(lowStockItemSchema),
      );
      return handleFetchResult(result);
    },
    ...options,
  });
}
