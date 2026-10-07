import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { getSession } from './auth'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

if (!CSRF_SECRET || CSRF_SECRET.length < 32) {
  throw new Error('CSRF_SECRET (or JWT_SECRET) must be at least 32 characters long')
}

const secretKey = new TextEncoder().encode(CSRF_SECRET)

export interface CSRFTokenPayload {
  sessionId: string
  timestamp: number
}

export async function generateCSRFToken(sessionId: string): Promise<string> {
  return new SignJWT({ sessionId, timestamp: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey)
}

export async function verifyCSRFToken(token: string): Promise<CSRFTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return {
      sessionId: payload.sessionId as string,
      timestamp: payload.timestamp as number,
    }
  } catch {
    return null
  }
}

export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for API calls)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken

  // Check cookie (for form submissions)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (cookieToken) return cookieToken

  return null
}

export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  })
}

export function clearCSRFTokenCookie(response: NextResponse): void {
  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export async function csrfProtection(
  request: NextRequest,
  sessionId: string
): Promise<{ valid: boolean; response?: NextResponse }> {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true }
  }

  const token = getCSRFTokenFromRequest(request)
  if (!token) {
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'CSRF token missing' },
        { status: 403 }
      ),
    }
  }

  const payload = await verifyCSRFToken(token)
  if (!payload || payload.sessionId !== sessionId) {
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'Invalid CSRF token' },
        { status: 403 }
      ),
    }
  }

  return { valid: true }
}

export async function verifyCSRF(request: NextRequest): Promise<{ valid: boolean; response?: NextResponse; sessionId?: string }> {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true }
  }

  const session = await getSession()
  if (!session) {
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const token = getCSRFTokenFromRequest(request)
  if (!token) {
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'CSRF token missing' },
        { status: 403 }
      ),
    }
  }

  const payload = await verifyCSRFToken(token)
  if (!payload || payload.sessionId !== session.userId) {
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'Invalid CSRF token' },
        { status: 403 }
      ),
    }
  }

  return { valid: true, sessionId: session.userId }
}

export function addCSRFHeaders(response: NextResponse, token: string): NextResponse {
  response.headers.set(CSRF_HEADER_NAME, token)
  return response
}