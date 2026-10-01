import { ZodError } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Standardized API response utilities.
 *
 * Ensures consistent response shapes across all API endpoints:
 *
 * Success:
 *   { data: T, pagination?: Pagination, summary?: Summary }
 *
 * Error:
 *   { message: string, errors?: ZodErrorFormat[], code?: string }
 *
 * ZodError format is always the standard array form (error.errors),
 * NOT the flattened fieldErrors object form.
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
 * Build a paginated success response.
 */
export function paginatedResponse<T>(
  data: T,
  pagination: Pagination,
  summary?: Record<string, unknown>
): ApiSuccessResponse<T> {
  if (summary) {
    return { data, pagination, summary }
  }
  return { data, pagination }
}

/**
 * Build a success response with optional summary.
 */
export function successResponse<T>(
  data: T,
  summary?: Record<string, unknown> | string
): ApiSuccessResponse<T> {
  if (summary) {
    return { data, summary: typeof summary === 'string' ? { message: summary } : summary }
  }
  return { data }
}

/**
 * Build a standardized error response from a ZodError.
 *
 * Always uses the standard `error.errors` array format,
 * never the flattened `fieldErrors` object format.
 */
export function zodErrorResponse(
  error: ZodError,
  message = 'Validasi gagal'
): ApiErrorResponse {
  return {
    message,
    errors: error.errors,
  }
}

/**
 * Build a generic error response.
 */
export function errorResponse(
  message: string,
  status: number,
  code?: string
): NextResponse {
  const body: ApiErrorResponse = { message }
  if (code) {
    body.code = code
  }
  return NextResponse.json(body, { status })
}

/**
 * Handle a ZodError and return a standardized 400 response.
 */
export function handleZodError(error: ZodError): NextResponse {
  return NextResponse.json(zodErrorResponse(error), { status: 400 })
}

/**
 * Custom error class for domain-specific errors with a code.
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code?: string

  constructor(
    message: string,
    statusCode: number,
    code?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Handle any error in a standardized way.
 *
 * - ZodError → 400 with standard errors array
 * - ApiError → uses its own statusCode and code
 * - Other errors → 500 with generic message
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return handleZodError(error)
  }

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code)
  }

  console.error('Unhandled API error:', error)
  return errorResponse('Terjadi kesalahan server', 500)
}
