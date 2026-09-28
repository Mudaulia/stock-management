import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const itemCreateSchema = z.object({
  code: z.string().min(1, 'Kode barang wajib diisi').max(50),
  name: z.string().min(1, 'Nama barang wajib diisi').max(255),
  unit: z.string().min(1, 'Satuan wajib diisi').max(50),
  minStock: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).default(0),
  description: z.string().optional(),
})

const itemQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['code', 'name', 'unit', 'currentStock', 'minStock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = itemQuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
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
        orderBy: { [query.sortBy]: query.sortOrder },
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
      prisma.item.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Parameter tidak valid', errors: error.errors }, { status: 400 })
    }
    console.error('Get items error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE_STAFF')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = itemCreateSchema.parse(body)

    // Check unique code
    const existing = await prisma.item.findUnique({ where: { code: data.code } })
    if (existing) {
      return NextResponse.json({ message: 'Kode barang sudah digunakan' }, { status: 400 })
    }

    const item = await prisma.item.create({
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        minStock: data.minStock,
        currentStock: data.currentStock,
        description: data.description,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'ITEM',
        entityId: item.id,
        newData: item,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi gagal', errors: error.errors }, { status: 400 })
    }
    console.error('Create item error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}