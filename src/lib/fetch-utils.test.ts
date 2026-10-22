import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ZodError } from "zod";
import {
  apiErrorSchema,
  apiSuccessSchema,
  fetchWithZod,
  formatZodErrors,
  getErrorMessage,
  paginatedResponseSchema,
} from "@/lib/fetch-utils";

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Mock response minimal dengan `headers` (dipakai wrapper untuk menangkap
// CSRF token dari response header).
const mockResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  statusText: init.statusText ?? "OK",
  headers: new Headers(),
  json: () => Promise.resolve(body),
});

describe("fetchWithZod", () => {
  it("returns ok:true with validated data for a valid success response", async () => {
    const body = { data: { id: "1", name: "Item A" } };
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse(body));

    const result = await fetchWithZod(
      "/api/items/1",
      apiSuccessSchema(itemSchema),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(body.data);
  });

  it("returns ok:true with pagination when present", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse({
          data: [{ id: "1", name: "Item A" }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      );

    const result = await fetchWithZod(
      "/api/items",
      paginatedResponseSchema(itemSchema),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pagination?.total).toBe(1);
  });

  it("parses a standardized error envelope", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse(
          { message: "Validasi gagal", code: "VALIDATION_ERROR" },
          { ok: false, status: 400, statusText: "Bad Request" },
        ),
      );

    const result = await fetchWithZod(
      "/api/items",
      apiSuccessSchema(itemSchema),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Validasi gagal");
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.status).toBe(400);
    }
  });

  it("falls back to plain message body on non-standard errors", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        mockResponse(
          { message: "Kesalahan server" },
          { ok: false, status: 500, statusText: "Internal Server Error" },
        ),
      );

    const result = await fetchWithZod(
      "/api/items",
      apiSuccessSchema(itemSchema),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Kesalahan server");
  });

  it("flags schema mismatch on success response with wrong shape", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: { id: 1, name: 2 } }));

    const result = await fetchWithZod(
      "/api/items",
      apiSuccessSchema(itemSchema),
    );

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toBe("Response shape validation failed");
  });

  it("maps network failure to status 0", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await fetchWithZod(
      "/api/items",
      apiSuccessSchema(itemSchema),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(0);
  });

  it("sends credentials include by default", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: { id: "1", name: "A" } }));
    global.fetch = fetchMock;

    await fetchWithZod("/api/items", apiSuccessSchema(itemSchema));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});

describe("apiErrorSchema", () => {
  it("requires message and allows optional errors/code", () => {
    expect(apiErrorSchema.safeParse({ message: "x" }).success).toBe(true);
    expect(apiErrorSchema.safeParse({}).success).toBe(false);
  });
});

describe("formatZodErrors", () => {
  it("maps zod issues into a field-error record", () => {
    const parsed = itemSchema.safeParse({ id: 1, name: 2 });
    expect(parsed.success).toBe(false);
    const errors = formatZodErrors(
      (parsed as { error: ZodError }).error.errors,
    );
    expect(errors.id).toBeTruthy();
    expect(errors.name).toBeTruthy();
  });

  it("returns empty object for non-array input", () => {
    expect(formatZodErrors("bogus" as unknown as unknown[])).toEqual({});
  });
});

describe("getErrorMessage", () => {
  it("returns empty string on ok results", () => {
    expect(getErrorMessage({ ok: true, data: null })).toBe("");
  });

  it("returns API message with fallback", () => {
    expect(getErrorMessage({ ok: false, message: "Gagal", status: 500 })).toBe(
      "Gagal",
    );
    expect(getErrorMessage({ ok: false, message: "", status: 500 })).toBe(
      "Terjadi kesalahan yang tidak diketahui",
    );
  });
});
