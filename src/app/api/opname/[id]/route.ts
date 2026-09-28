import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateOpnameSchema = z.object({
  physicalStock: z.coerce.number().int().nonnegative('Stok fisik tidak boleh negatif').optional(),
  notes: z.string().optional(),
})

const reconcileSchema = z.object({
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        item: {
          select: { id: true, code: true, name: true, unit: true, currentStock: true },
        },
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
        reconciliation: {
          include: {
            adjustedBy: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
      },
    })

    if (!opname) {
      return NextResponse.json({ message: 'Opname tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(opname)
  } catch (error) {
    console.error('GET /api/opname/[id] error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateOpnameSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
    })

    if (!opname) {
      return NextResponse.json({ message: 'Opname tidak ditemukan' }, { status: 404 })
    }

    if (opname.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Hanya opname dengan status PENDING yang dapat diubah' },
        { status: 400 }
      )
    }

    const { physicalStock, notes } = validation.data
    const systemStock = opname.systemStock
    const newPhysicalStock = physicalStock ?? opname.physicalStock
    const difference = newPhysicalStock - systemStock

    const updatedOpname = await prisma.$transaction(async (tx) => {
      const updated = await tx.stockOpname.update({
        where: { id },
        data: {
          physicalStock: newPhysicalStock,
          difference,
          notes: notes ?? opname.notes,
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
          userId: session.user.id,
          action: 'UPDATE',
          entity: 'StockOpname',
          entityId: id,
          oldData: {
            physicalStock: opname.physicalStock,
            difference: opname.difference,
            notes: opname.notes,
          },
          newData: {
            physicalStock: newPhysicalStock,
            difference,
            notes: notes ?? opname.notes,
          },
        },
      })

      return updated
    })

    return NextResponse.json(updatedOpname)
  } catch (error) {
    console.error('PUT /api/opname/[id] error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
    })

    if (!opname) {
      return NextResponse.json({ message: 'Opname tidak ditemukan' }, { status: 404 })
    }

    if (opname.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Hanya opname dengan status PENDING yang dapat dibatalkan' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.stockOpname.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CANCEL',
          entity: 'StockOpname',
          entityId: id,
          oldData: { status: opname.status },
          newData: { status: 'CANCELLED' },
        },
      })
    })

    return NextResponse.json({ message: 'Opname dibatalkan' })
  } catch (error) {
    console.error('DELETE /api/opname/[id] error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}