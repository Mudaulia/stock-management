import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const user = await requireAuth()

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactions = await prisma.stockTransaction.findMany({
      take: 5,
      orderBy: { transactionDate: 'desc' },
      include: { item: { select: { name: true, code: true } } },
    })

    return NextResponse.json(successResponse(transactions))
  } catch (error) {
    return handleApiError(error)
  }
}