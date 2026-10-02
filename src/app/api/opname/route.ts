import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { handleApiError, paginatedResponse, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const opnameSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  physicalStock: z.coerce.number().int().nonnegative('Stok fisik tidak boleh negatif'),
  notes: z.string().optional(),
  opnameDate: z.string().min(1, 'Tanggal wajib diisi'),
})

const reconcileSchema = z.object({
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { item: { code: { contains: search, mode: 'insensitive' } } },
        { item: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.opnameDate = {}
      if (startDate) where.opnameDate.gte = new Date(startDate)
      if (endDate) where.opnameDate.lte = new Date(endDate)
    }

    const [opnames, total] = await Promise.all([
      prisma.stockOpname.findMany({
        where,
        skip,
        take: limit,
        orderBy: { opnameDate: 'desc' },
        include: {
          item: {
            select: { id: true, code: true, name: true, unit: true, currentStock: true },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
          reconciliation: {
            select: { id: true, adjustedAt: true, adjustedBy: { select: { fullName: true } } },
          },
        },
      }),
      prisma.stockOpname.count({ where }),
    ])

    return NextResponse.json(
      paginatedResponse(opnames, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Role check: Only ADMIN and WAREHOUSE_STAFF can create opname
    if (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE_STAFF') {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validation = opnameSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validasi gagal', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { itemId, physicalStock, notes, opnameDate } = validation.data

    // Check if item exists and is active
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 })
    }

    if (!item.isActive) {
      return NextResponse.json({ message: 'Barang tidak aktif' }, { status: 400 })
    }

    // Check if there's already a pending opname for this item
    const existingPending = await prisma.stockOpname.findFirst({
      where: {
        itemId,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { message: 'Masih ada opname pending untuk barang ini. Selesaikan atau batalkan terlebih dahulu.' },
        { status: 400 }
      )
    }

    const systemStock = item.currentStock
    const difference = physicalStock - systemStock

    const opname = await prisma.$transaction(async (tx) => {
      const newOpname = await tx.stockOpname.create({
        data: {
          itemId,
          systemStock,
          physicalStock,
          difference,
          notes,
          opnameDate: new Date(opnameDate),
          createdById: user.id,
          status: 'PENDING',
        },
        include: {
          item: {
            select: { id: true, code: true, name: true, unit: true, currentStock: true },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entity: 'StockOpname',
          entityId: newOpname.id,
          newData: {
            itemId,
            systemStock,
            physicalStock,
            difference,
            notes,
            opnameDate,
            status: 'PENDING',
          },
        },
      })

      return newOpname
    })

    return NextResponse.json(successResponse(opname), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}