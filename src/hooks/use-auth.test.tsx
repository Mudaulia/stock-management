import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAuth } from "@/hooks/use-auth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
}

const sampleUser = {
  id: "u1",
  email: "a@b.c",
  username: "abc",
  fullName: "A B C",
  role: "ADMIN",
  isActive: true,
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns user on successful /api/auth/me response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: sampleUser }),
    } as Response);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(sampleUser);
    expect(fetch).toHaveBeenCalledWith("/api/auth/me", {
      credentials: "include",
    });
  });

  it("returns null user when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("returns null user on network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("deduplicates concurrent calls via React Query cache", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: sampleUser }),
    } as Response);

    const wrapper = createWrapper();
    renderHook(() => useAuth(), { wrapper });
    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });
});
