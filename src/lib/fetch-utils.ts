import { z, ZodError, ZodTypeAny } from 'zod'

/**
 * Standardized API response shape (server-side).
 *
 * Success:
 *   { data: T, pagination?: Pagination, summary?: Summary }
 *
 * Error:
 *   { message: string, errors?: unknown[], code?: string }
 */

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  data: T
  pagination?: Pagination
  summary?: Record<string, unknown>
}

export interface ApiErrorResponse {
  message: string
  errors?: unknown[]
  code?: string
}

/**
 * Zod schema for the standard API success response envelope.
 * Used to validate the *shape* of the response, not the data itself.
 */
export const apiSuccessSchema = <T extends ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .optional(),
    summary: z.record(z.unknown()).optional(),
  })

/**
 * Zod schema for the standard API error response envelope.
 */
export const apiErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.unknown()).optional(),
  code: z.string().optional(),
})

/**
 * Zod schema for a paginated list response.
 */
export const paginatedResponseSchema = <T extends ZodTypeAny>(dataSchema: T) =>
  apiSuccessSchema(z.array(dataSchema))

/**
 * Zod schema for a single-item response.
 */
export const singleResponseSchema = <T extends ZodTypeAny>(dataSchema: T) =>
  apiSuccessSchema(dataSchema)

/**
 * Zod schema for a summary-only response (no data array).
 */
export const summaryResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
  summary: z.record(z.unknown()),
})

/**
 * Result type for fetchWithZod — either success or error.
 */
export type FetchResult<T> =
  | { ok: true; data: T; pagination?: Pagination; summary?: Record<string, unknown> }
  | { ok: false; message: string; errors?: unknown[]; code?: string; status: number }

/**
 * Fetch wrapper that validates the response against a Zod schema.
 *
 * On success: returns `{ ok: true, data, pagination?, summary? }`
 * On failure: returns `{ ok: false, message, errors?, code?, status }`
 *
 * This eliminates the need for try/catch + manual shape checking in every
 * frontend component. The Zod schema acts as a type guard and provides
 * structured error information.
 *
 * @param input - The fetch URL or Request object
 * @param schema - Zod schema to validate the response body against
 * @param init - Optional fetch init options
 *
 * @example
 * ```ts
 * const result = await fetchWithZod('/api/items', paginatedResponseSchema(itemSchema))
 * if (!result.ok) {
 *   console.error(result.message, result.errors)
 *   return
 * }
 * setItems(result.data)
 * setPagination(result.pagination)
 * ```
 */
export async function fetchWithZod<T>(
  input: string | URL | Request,
  schema: ZodTypeAny,
  init?: RequestInit
): Promise<FetchResult<T>> {
  try {
    const fetchInit = {
      ...init,
      credentials: 'include' as RequestCredentials,
    }
    console.log('fetchWithZod: fetching', input, fetchInit)
    const response = await fetch(input, fetchInit)
    console.log('fetchWithZod: response status', response.status)
    const body = await response.json()
    console.log('fetchWithZod: response body', body)

    if (!response.ok) {
      // Try to parse as standardized error response
      const errorResult = apiErrorSchema.safeParse(body)
      if (errorResult.success) {
        return {
          ok: false,
          message: errorResult.data.message,
          errors: errorResult.data.errors,
          code: errorResult.data.code,
          status: response.status,
        }
      }

      // Fallback: body might be a plain error message
      if (typeof body === 'object' && body !== null && 'message' in body) {
        return {
          ok: false,
          message: String((body as { message: unknown }).message),
          status: response.status,
        }
      }

      return {
        ok: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      }
    }

    // Validate success response against schema
    const result = schema.safeParse(body)
    if (!result.success) {
      // Response shape doesn't match expected schema
      const errorMessages = result.error.errors.map((e) => ({
        path: e.path.join('.') || '(root)',
        message: e.message,
        code: e.code,
      }))

      return {
        ok: false,
        message: 'Response shape validation failed',
        errors: errorMessages,
        status: response.status,
      }
    }

    const validated = result.data as {
      data: T
      pagination?: Pagination
      summary?: Record<string, unknown>
    }

    return {
      ok: true,
      data: validated.data,
      pagination: validated.pagination,
      summary: validated.summary,
    }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        ok: false,
        message: 'Response validation failed',
        errors: err.errors,
        status: 0,
      }
    }

    if (err instanceof Error) {
      return {
        ok: false,
        message: err.message,
        status: 0,
      }
    }

    return {
      ok: false,
      message: 'Unknown error during fetch',
      status: 0,
    }
  }
}

/**
 * Convenience wrapper for fetching a paginated list.
 *
 * @example
 * ```ts
 * const result = await fetchPaginated('/api/items', itemSchema)
 * if (!result.ok) { showError(result.message); return }
 * setItems(result.data)
 * setPagination(result.pagination)
 * ```
 */
export async function fetchPaginated<T>(
  url: string,
  dataSchema: ZodTypeAny,
  init?: RequestInit
): Promise<FetchResult<T[]>> {
  return fetchWithZod<T[]>(url, paginatedResponseSchema(dataSchema), init)
}

/**
 * Convenience wrapper for fetching a single item.
 *
 * @example
 * ```ts
 * const result = await fetchSingle('/api/items/123', itemSchema)
 * if (!result.ok) { showError(result.message); return }
 * setItem(result.data)
 * ```
 */
export async function fetchSingle<T>(
  url: string,
  dataSchema: ZodTypeAny,
  init?: RequestInit
): Promise<FetchResult<T>> {
  return fetchWithZod<T>(url, singleResponseSchema(dataSchema), init)
}

/**
 * Convenience wrapper for fetching a summary-only response (e.g. reports).
 *
 * @example
 * ```ts
 * const result = await fetchSummary('/api/reports/stock', itemSchema)
 * if (!result.ok) { showError(result.message); return }
 * setItems(result.data)
 * setSummary(result.summary)
 * ```
 */
export async function fetchSummary<T>(
  url: string,
  dataSchema: ZodTypeAny,
  init?: RequestInit
): Promise<FetchResult<T[]>> {
  return fetchWithZod<T[]>(url, summaryResponseSchema.extend({ data: z.array(dataSchema) }), init)
}

/**
 * Format ZodError into a human-readable error map for form display.
 *
 * @example
 * ```ts
 * const result = await fetchWithZod('/api/items', itemSchema)
 * if (!result.ok && result.errors) {
 *   const fieldErrors = formatZodErrors(result.errors)
 *   setError('code', { message: fieldErrors.code })
 * }
 * ```
 */
export function formatZodErrors(errors: unknown[]): Record<string, string> {
  if (!Array.isArray(errors)) return {}

  return errors.reduce<Record<string, string>>((acc, err) => {
    if (err && typeof err === 'object' && 'path' in err && 'message' in err) {
      const path = (err as { path: unknown[] }).path.join('.') || '(root)'
      acc[path] = String((err as { message: unknown }).message)
    }
    return acc
  }, {})
}

/**
 * Extract a user-friendly error message from a FetchResult.
 * Prioritizes the API message, falls back to generic text.
 */
export function getErrorMessage(result: FetchResult<unknown>): string {
  if (result.ok) return ''
  return result.message || 'Terjadi kesalahan yang tidak diketahui'
}
