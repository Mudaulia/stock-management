import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, setSession } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const rateLimitResult = await rateLimit(ip, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'auth:login',
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'Kredensial tidak valid' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Kredensial tidak valid' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session and get CSRF token
    const csrfToken = await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    })

    const response = NextResponse.json(
      successResponse({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      }),
      { headers: getRateLimitHeaders(rateLimitResult) }
    )

    // Add CSRF token to response headers for client-side use
    response.headers.set('x-csrf-token', csrfToken)

    return response
  } catch (error) {
    return handleApiError(error)
  }
}