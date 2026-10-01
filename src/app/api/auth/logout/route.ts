import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'
import { successResponse } from '@/lib/api-response'

export async function POST() {
  await clearSession()
  return NextResponse.json(successResponse(null, 'Logout berhasil'))
}