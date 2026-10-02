import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, paginatedResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const itemCreateSchema = z.object({
  code: z.string().min(1, 'Kode barang wajib diisi').max(50),
  name: z.string().min(1, 'Nama barang wajib diisi').max(255),
  unit: z.string().min(1, 'Satuan wajib diisi').max(50),
  minStock: z.number().int().min(0).default(0),

  /*
   * currentStock is allowed only when creating a brand-new item.
   *
   * It is recorded as STOCK_IN below so every initial quantity
   * has an inventory transaction.
   */
  currentStock: z.number().int().min(0).default(0),

  description: z.string().optional(),
})

const itemQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum([
      'code',
      'name',
      'unit',
      'currentStock',
      'minStock',
      'createdAt',
    ])
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

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

    const query = itemQuerySchema.parse(
      Object.fromEntries(searchParams)
    )

    const where: {
      OR?: Array<{
        code?: {
          contains: string
          mode: 'insensitive'
        }
        name?: {
          contains: string
          mode: 'insensitive'
        }
      }>
      isActive?: boolean
    } = {}

    if (query.search) {
      where.OR = [
        {
          code: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          minStock: true,
          currentStock: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.item.count({
        where,
      }),
    ])

    return NextResponse.json(
      paginatedResponse(items, {
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
    const data = itemCreateSchema.parse(body)

    const existing = await prisma.item.findUnique({
      where: {
        code: data.code,
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          message: 'Kode barang sudah digunakan',
        },
        { status: 400 }
      )
    }

    const item = await prisma.$transaction(
      async (tx) => {
        const createdItem = await tx.item.create({
          data: {
            code: data.code,
            name: data.name,
            unit: data.unit,
            minStock: data.minStock,
            currentStock: data.currentStock,
            description: data.description,
          },
        })

        /*
         * Initial stock is represented as a real inventory
         * movement. This keeps currentStock aligned with
         * the transaction history from the first day.
         */
        if (data.currentStock > 0) {
          await tx.stockTransaction.create({
            data: {
              itemId: createdItem.id,
              type: 'STOCK_IN',
              quantity: data.currentStock,
              reference: `INITIAL-${createdItem.id.slice(0, 8)}`,
              notes: 'Stok awal saat pembuatan barang',
              transactionDate: new Date(),
              createdById: user.id,
            },
          })
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',
            entity: 'ITEM',
            entityId: createdItem.id,
            newData: createdItem,
          },
        })

        return createdItem
      }
    )

    return NextResponse.json(successResponse(item), {
      status: 201,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
