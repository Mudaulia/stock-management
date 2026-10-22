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
import { stockOpnameSchema } from "@/lib/schemas";
import {
  queryKeys,
  buildUrl,
  handleFetchResult,
  handleFetchPaginatedResult,
  mutateJson,
} from "./shared";

export interface UseOpnameListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface OpnameListResponse {
  data: z.infer<typeof stockOpnameSchema>[];
  pagination?: Pagination;
  summary?: Record<string, unknown>;
}

export function useOpnameList(
  params: UseOpnameListParams = {},
  options?: Omit<
    UseQueryOptions<
      OpnameListResponse,
      Error,
      OpnameListResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<
    OpnameListResponse,
    Error,
    OpnameListResponse,
    readonly unknown[]
  >({
    queryKey: queryKeys.opname.list(params as Record<string, unknown>),
    queryFn: async (): Promise<OpnameListResponse> => {
      const result = await fetchPaginated(
        buildUrl("/api/opname", params as Record<string, unknown>),
        stockOpnameSchema,
      );
      return handleFetchPaginatedResult(result);
    },
    ...options,
  });
}

export function useOpnameDetail(
  id: string,
  options?: UseQueryOptions<unknown, Error, unknown, readonly unknown[]>,
) {
  return useQuery({
    queryKey: queryKeys.opname.detail(id),
    queryFn: async () => {
      const result = await fetchSingle(`/api/opname/${id}`, z.unknown());
      return handleFetchResult(result);
    },
    enabled: !!id,
    ...options,
  });
}

export function useCreateOpname(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson("/api/opname", "POST", data, "Failed to create opname"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.lowStockItems,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useReconcileOpname(
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
      mutateJson(
        `/api/opname/${id}/reconcile`,
        "POST",
        data,
        "Failed to reconcile opname",
      ),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.lowStockItems,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useCancelOpname(
  options?: UseMutationOptions<unknown, Error, string, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      mutateJson(
        `/api/opname/${id}`,
        "DELETE",
        undefined,
        "Failed to cancel opname",
      ),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opname.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
