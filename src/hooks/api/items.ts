"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { fetchPaginated, fetchSingle, Pagination } from "@/lib/fetch-utils";
import { z } from "zod";
import { itemSchema } from "@/lib/schemas";
import {
  queryKeys,
  buildUrl,
  handleFetchResult,
  handleFetchPaginatedResult,
  mutateJson,
} from "./shared";
import type {
  UseStockReportParams,
  UseLowStockReportParams,
  UseMutationReportParams,
} from "./reports";

export interface UseItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ItemsResponse {
  data: z.infer<typeof itemSchema>[];
  pagination?: Pagination;
  summary?: Record<string, unknown>;
}

export function useItems(
  params: UseItemsParams = {},
  options?: Omit<
    UseQueryOptions<ItemsResponse, Error, ItemsResponse, readonly unknown[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<ItemsResponse, Error, ItemsResponse, readonly unknown[]>({
    queryKey: queryKeys.items.list(params as Record<string, unknown>),
    queryFn: async (): Promise<ItemsResponse> => {
      const result = await fetchPaginated(
        buildUrl("/api/items", params as Record<string, unknown>),
        itemSchema,
      );
      return handleFetchPaginatedResult(result);
    },
    ...options,
  });
}

export function useItem(
  id: string,
  options?: UseQueryOptions<unknown, Error, unknown, readonly unknown[]>,
) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const result = await fetchSingle(`/api/items/${id}`, z.unknown());
      return handleFetchResult(result);
    },
    enabled: !!id,
    ...options,
  });
}

export function useCreateItem(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson("/api/items", "POST", data, "Failed to create item"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useUpdateItem(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: unknown },
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) =>
      mutateJson(`/api/items/${id}`, "PUT", data, "Failed to update item"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.items.detail(variables.id),
      });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useDeleteItem(
  options?: UseMutationOptions<unknown, Error, string, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      mutateJson(
        `/api/items/${id}`,
        "DELETE",
        undefined,
        "Failed to delete item",
      ),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useBulkDeleteItems(
  options?: UseMutationOptions<unknown, Error, string[], unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) =>
      // Endpoint yang benar: DELETE /api/items dengan body { ids }
      mutateJson("/api/items", "DELETE", { ids }, "Failed to delete items"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useExportItems(
  options?: UseMutationOptions<
    Blob,
    Error,
    { ids?: string[]; params?: UseItemsParams },
    unknown
  >,
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams();
      if (ids && ids.length > 0) {
        searchParams.append("ids", ids.join(","));
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const response = await fetch(
        `/api/items/export?${searchParams.toString()}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to export items");
      }
      return response.blob();
    },
    ...options,
  });
}

export function useExportStockReport(
  options?: UseMutationOptions<
    Blob,
    Error,
    { ids?: string[]; params?: UseStockReportParams },
    unknown
  >,
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams();
      if (ids && ids.length > 0) {
        searchParams.append("ids", ids.join(","));
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const response = await fetch(
        `/api/reports/stock/export?${searchParams.toString()}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to export stock report");
      }
      return response.blob();
    },
    ...options,
  });
}

export function useExportLowStockReport(
  options?: UseMutationOptions<
    Blob,
    Error,
    { ids?: string[]; params?: UseLowStockReportParams },
    unknown
  >,
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams();
      if (ids && ids.length > 0) {
        searchParams.append("ids", ids.join(","));
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const response = await fetch(
        `/api/reports/low-stock/export?${searchParams.toString()}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to export low stock report");
      }
      return response.blob();
    },
    ...options,
  });
}

export function useExportMutationReport(
  options?: UseMutationOptions<
    Blob,
    Error,
    { ids?: string[]; params?: UseMutationReportParams },
    unknown
  >,
) {
  return useMutation({
    mutationFn: async ({ ids, params }) => {
      const searchParams = new URLSearchParams();
      if (ids && ids.length > 0) {
        searchParams.append("ids", ids.join(","));
      }
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
      }
      const response = await fetch(
        `/api/reports/mutation/export?${searchParams.toString()}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to export mutation report");
      }
      return response.blob();
    },
    ...options,
  });
}
