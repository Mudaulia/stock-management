import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-response'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    return handleApiError(error)
  }
}