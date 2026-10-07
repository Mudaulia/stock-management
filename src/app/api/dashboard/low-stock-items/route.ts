import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'

export async function GET() {
  try {
    await requireAuth()

    const items = await prisma.item.findMany({
      where: {
        isActive: true,
        currentStock: { lte: prisma.item.fields.minStock },
      },
      orderBy: { currentStock: 'asc' },
      take: 5,
      select: { id: true, code: true, name: true, currentStock: true, minStock: true, unit: true },
    })

    return NextResponse.json(successResponse(items))
  } catch (error) {
    return handleApiError(error)
  }
}