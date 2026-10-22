"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Syncs a single string state with the URL query string (shallow replace).
 * Empty or default values are removed from the URL to keep it clean.
 *
 * NOTE: uses `useSearchParams`, so the calling page must be rendered
 * inside a `<Suspense>` boundary (Next.js App Router requirement).
 */
export function useUrlState(
  key: string,
  defaultValue = "",
): [string, (value: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "" || next === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams, key, defaultValue],
  );

  return [value, setValue];
}
