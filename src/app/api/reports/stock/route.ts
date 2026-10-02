import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, paginatedResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true'
    const isActive = searchParams.get('isActive') !== 'false'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (lowStockOnly) {
      where.currentStock = { lte: prisma.item.fields.minStock }
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          currentStock: true,
          minStock: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.item.count({ where }),
    ])

    // Calculate stock status for each item
    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus: item.currentStock <= 0 ? 'OUT_OF_STOCK' : 
                   item.currentStock <= item.minStock ? 'LOW_STOCK' : 'NORMAL',
      stockPercentage: item.minStock > 0 ? Math.round((item.currentStock / item.minStock) * 100) : 100,
    }))

    // Calculate summary
    const summary = {
      totalItems: total,
      lowStockCount: itemsWithStatus.filter(i => i.stockStatus === 'LOW_STOCK').length,
      outOfStockCount: itemsWithStatus.filter(i => i.stockStatus === 'OUT_OF_STOCK').length,
      normalCount: itemsWithStatus.filter(i => i.stockStatus === 'NORMAL').length,
    }

    return NextResponse.json(
      paginatedResponse(itemsWithStatus, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, summary)
    )
  } catch (error) {
    return handleApiError(error)
  }
}