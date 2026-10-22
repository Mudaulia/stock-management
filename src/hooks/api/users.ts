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
import {
  queryKeys,
  buildUrl,
  handleFetchPaginatedResult,
  mutateJson,
} from "./shared";

export interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "ADMIN" | "WAREHOUSE_STAFF" | "VIEWER";
  isActive?: boolean;
}

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  fullName: z.string(),
  role: z.enum(["ADMIN", "WAREHOUSE_STAFF", "VIEWER"]),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserRow = z.infer<typeof userSchema>;

export interface UsersResponse {
  data: UserRow[];
  pagination?: Pagination;
}

export function useUsers(
  params: UseUsersParams = {},
  options?: Omit<
    UseQueryOptions<UsersResponse, Error, UsersResponse, readonly unknown[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<UsersResponse, Error, UsersResponse, readonly unknown[]>({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: async (): Promise<UsersResponse> => {
      const result = await fetchPaginated(
        buildUrl("/api/users", params as Record<string, unknown>),
        userSchema,
      );
      return handleFetchPaginatedResult(result);
    },
    ...options,
  });
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

export function useCreateUser(
  options?: UseMutationOptions<unknown, Error, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) =>
      mutateJson("/api/users", "POST", data, "Gagal menambahkan pengguna"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUsers(queryClient);
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useUpdateUser(
  options?: UseMutationOptions<
    unknown,
    Error,
    { id: string; data: unknown },
    unknown
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) =>
      mutateJson(`/api/users/${id}`, "PUT", data, "Gagal memperbarui pengguna"),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidateUsers(queryClient);
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
