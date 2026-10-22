"use client";

import { FetchResult, Pagination } from "@/lib/fetch-utils";
import {
  captureCSRFTokenFromResponse,
  csrfHeader,
} from "@/lib/csrf-client";

// ============================================
// Query Keys Factory
// ============================================

export const queryKeys = {
  items: {
    all: ["items"] as const,
    list: (params?: Record<string, unknown>) =>
      ["items", "list", params] as const,
    detail: (id: string) => ["items", "detail", id] as const,
  },
  stockIn: {
    all: ["stock-in"] as const,
    list: (params?: Record<string, unknown>) =>
      ["stock-in", "list", params] as const,
  },
  stockOut: {
    all: ["stock-out"] as const,
    list: (params?: Record<string, unknown>) =>
      ["stock-out", "list", params] as const,
  },
  stockAdjustment: {
    all: ["stock-adjustment"] as const,
    list: (params?: Record<string, unknown>) =>
      ["stock-adjustment", "list", params] as const,
  },
  opname: {
    all: ["opname"] as const,
    list: (params?: Record<string, unknown>) =>
      ["opname", "list", params] as const,
    detail: (id: string) => ["opname", "detail", id] as const,
  },
  reports: {
    all: ["reports"] as const,
    stock: {
      all: ["reports", "stock"] as const,
      list: (params?: Record<string, unknown>) =>
        ["reports", "stock", "list", params] as const,
    },
    lowStock: {
      all: ["reports", "low-stock"] as const,
      list: (params?: Record<string, unknown>) =>
        ["reports", "low-stock", "list", params] as const,
    },
    mutation: {
      all: ["reports", "mutation"] as const,
      list: (params?: Record<string, unknown>) =>
        ["reports", "mutation", "list", params] as const,
    },
  },
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) =>
      ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    recentTransactions: ["dashboard", "recent-transactions"] as const,
    lowStockItems: ["dashboard", "low-stock-items"] as const,
  },
} as const;

// Type helper for query key params - use a more permissive type
export type QueryKeyParams = Record<string, unknown>;

// ============================================
// Generic Query Helpers
// ============================================

export function buildUrl(base: string, params?: QueryKeyParams): string {
  if (!params) return base;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}

export function handleFetchResult<T>(result: FetchResult<T>): T {
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export function handleFetchPaginatedResult<T>(
  result: FetchResult<{
    data: T[];
    pagination?: Pagination;
    summary?: Record<string, unknown>;
  }>,
): { data: T[]; pagination?: Pagination; summary?: Record<string, unknown> } {
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export function handleFetchPaginatedWithSummaryResult<T, S>(
  result: FetchResult<{ data: T[]; pagination?: Pagination; summary?: S }>,
): { data: T[]; pagination?: Pagination; summary?: S } {
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

/**
 * Shared JSON mutation helper for POST/PUT/DELETE with the standard envelope.
 */
export async function mutateJson(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  fallbackError = "Request gagal",
): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      // CSRF double-submit: header-only token (server tidak menerima dari cookie)
      ...csrfHeader(),
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  captureCSRFTokenFromResponse(response);
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || fallbackError);
  return json;
}
