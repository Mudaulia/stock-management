"use client";

import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (!response.ok) return null;
  const json = await response.json();
  return (json?.data as User | undefined) ?? null;
}

/**
 * Auth state via React Query — deduplicated & cached across all consumers
 * (dashboard layout, page, sidebar) within staleTime window.
 */
export function useAuth() {
  const query = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
  };
}
