import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, paginatedResponse, successResponse } from '@/lib/api-response'

const stockInCreateSchema = z.object({
  itemId: z.string().cuid('ID barang tidak valid'),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().datetime().optional(),
})

const stockInQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  itemId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['transactionDate', 'quantity', 'createdAt']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = stockInQuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = { type: 'STOCK_IN' }

    if (query.itemId) where.itemId = query.itemId
    if (query.startDate || query.endDate) {
      where.transactionDate = {}
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate)
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          item: { select: { id: true, code: true, name: true, unit: true } },
          createdBy: { select: { id: true, username: true, fullName: true } },
        },
      }),
      prisma.stockTransaction.count({ where }),
    ])

    return NextResponse.json(
      paginatedResponse(transactions, {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      })
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE_STAFF')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = stockInCreateSchema.parse(body)

    // Verify item exists and is active
    const item = await prisma.item.findUnique({ where: { id: data.itemId } })
    if (!item || !item.isActive) {
      return NextResponse.json({ message: 'Barang tidak ditemukan atau nonaktif' }, { status: 404 })
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.stockTransaction.create({
        data: {
          itemId: data.itemId,
          type: 'STOCK_IN',
          quantity: data.quantity,
          reference: data.reference,
          notes: data.notes,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          createdById: user.id,
        },
        include: {
          item: { select: { id: true, code: true, name: true, unit: true } },
        },
      })

      // Update item current stock
      await tx.item.update({
        where: { id: data.itemId },
        data: { currentStock: { increment: data.quantity } },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entity: 'STOCK_TRANSACTION',
          entityId: transaction.id,
          newData: transaction,
        },
      })

      return transaction
    })

    return NextResponse.json(successResponse(result), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}