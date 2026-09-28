import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const stockOutCreateSchema = z.object({
  itemId: z.string().cuid('ID barang tidak valid'),
  quantity: z.number().int().positive('Jumlah harus lebih dari 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  transactionDate: z.string().datetime().optional(),
})

const stockOutQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  itemId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(['transactionDate', 'quantity', 'createdAt'])
    .default('transactionDate'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

class StockUnavailableError extends Error {
  constructor() {
    super('Stok tidak mencukupi atau barang sudah tidak aktif.')
    this.name = 'StockUnavailableError'
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const query = stockOutQuerySchema.parse(
      Object.fromEntries(searchParams)
    )

    const where: {
      type: 'STOCK_OUT'
      itemId?: string
      transactionDate?: {
        gte?: Date
        lte?: Date
      }
    } = {
      type: 'STOCK_OUT',
    }

    if (query.itemId) {
      where.itemId = query.itemId
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {}

      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate)
      }

      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        include: {
          item: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
              currentStock: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.stockTransaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Parameter tidak valid',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Get stock out error:', error)

    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (
      !user ||
      (user.role !== 'ADMIN' &&
        user.role !== 'WAREHOUSE_STAFF')
    ) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = stockOutCreateSchema.parse(body)

    /*
     * Friendly pre-check only.
     *
     * This MUST NOT be considered the concurrency guarantee.
     * The actual stock validation happens atomically inside
     * the transaction below.
     */
    const item = await prisma.item.findUnique({
      where: {
        id: data.itemId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        currentStock: true,
        isActive: true,
      },
    })

    if (!item || !item.isActive) {
      return NextResponse.json(
        {
          message:
            'Barang tidak ditemukan atau nonaktif',
        },
        { status: 404 }
      )
    }

    if (item.currentStock < data.quantity) {
      return NextResponse.json(
        {
          message:
            `Stok tidak mencukupi. Stok tersedia: ${item.currentStock}`,
        },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Critical concurrency protection:
         *
         * The decrement only succeeds when the current database
         * value is still >= requested quantity.
         *
         * This prevents:
         *
         * Request A: stock 10 -> request 8
         * Request B: stock 10 -> request 8
         *
         * from producing stock -6.
         */
        const stockUpdate = await tx.item.updateMany({
          where: {
            id: data.itemId,
            isActive: true,
            currentStock: {
              gte: data.quantity,
            },
          },
          data: {
            currentStock: {
              decrement: data.quantity,
            },
          },
        })

        if (stockUpdate.count !== 1) {
          throw new StockUnavailableError()
        }

        const transaction =
          await tx.stockTransaction.create({
            data: {
              itemId: data.itemId,
              type: 'STOCK_OUT',
              quantity: data.quantity,
              reference: data.reference,
              notes: data.notes,
              transactionDate: data.transactionDate
                ? new Date(data.transactionDate)
                : new Date(),
              createdById: user.id,
            },
            include: {
              item: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                  currentStock: true,
                },
              },
            },
          })

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
      }
    )

    return NextResponse.json(result, {
      status: 201,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validasi gagal',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    if (error instanceof StockUnavailableError) {
      return NextResponse.json(
        {
          message:
            'Stok berubah atau tidak mencukupi. Silakan refresh stok dan coba lagi.',
        },
        { status: 409 }
      )
    }

    console.error('Create stock out error:', error)

    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
