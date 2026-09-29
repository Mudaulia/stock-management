import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const itemId = searchParams.get('itemId')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { item: { code: { contains: search, mode: 'insensitive' } } },
        { item: { name: { contains: search, mode: 'insensitive' } } },
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (itemId) {
      where.itemId = itemId
    }

    if (startDate || endDate) {
      where.transactionDate = {}
      if (startDate) where.transactionDate.gte = new Date(startDate)
      if (endDate) where.transactionDate.lte = new Date(endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          item: {
            select: { id: true, code: true, name: true, unit: true },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.stockTransaction.count({ where }),
    ])

    // Calculate summary by type
    const summary = await prisma.stockTransaction.groupBy({
      by: ['type'],
      where: {
        ...where,
        // Remove pagination for summary
        skip: undefined,
        take: undefined,
      },
      _sum: { quantity: true },
      _count: { id: true },
    })

    const summaryByType = summary.reduce((acc, curr) => {
      acc[curr.type] = {
        totalQuantity: curr._sum.quantity || 0,
        transactionCount: curr._count.id,
      }
      return acc
    }, {} as Record<string, { totalQuantity: number; transactionCount: number }>)

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summaryByType,
    })
  } catch (error) {
    console.error('GET /api/reports/mutation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}