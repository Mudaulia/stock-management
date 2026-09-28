import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const includeZeroStock = searchParams.get('includeZeroStock') === 'true'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (includeZeroStock) {
      where.currentStock = { lte: prisma.item.fields.minStock }
    } else {
      where.AND = [
        { currentStock: { gt: 0 } },
        { currentStock: { lte: prisma.item.fields.minStock } },
      ]
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { currentStock: 'asc' },
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

    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus: item.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      shortage: item.minStock - item.currentStock,
      stockPercentage: item.minStock > 0 ? Math.round((item.currentStock / item.minStock) * 100) : 0,
    }))

    return NextResponse.json({
      data: itemsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalLowStock: itemsWithStatus.filter(i => i.stockStatus === 'LOW_STOCK').length,
        totalOutOfStock: itemsWithStatus.filter(i => i.stockStatus === 'OUT_OF_STOCK').length,
        totalItems: itemsWithStatus.length,
      },
    })
  } catch (error) {
    console.error('GET /api/reports/low-stock error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}