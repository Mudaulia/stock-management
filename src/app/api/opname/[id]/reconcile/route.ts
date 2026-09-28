import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reconcileSchema = z.object({
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can reconcile
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Hanya ADMIN yang dapat merekonsiliasi opname' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = reconcileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { notes } = validation.data

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: { item: true },
    })

    if (!opname) {
      return NextResponse.json({ message: 'Opname tidak ditemukan' }, { status: 404 })
    }

    if (opname.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Hanya opname dengan status PENDING yang dapat direkonsiliasi' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update item stock to physical stock
      const updatedItem = await tx.item.update({
        where: { id: opname.itemId },
        data: { currentStock: opname.physicalStock },
      })

      // Update opname status
      const updatedOpname = await tx.stockOpname.update({
        where: { id },
        data: { status: 'RECONCILED' },
      })

      // Create reconciliation record
      const reconciliation = await tx.stockReconciliation.create({
        data: {
          opnameId: id,
          adjustedById: session.user.id,
          notes,
        },
      })

      // Create adjustment transaction record
      if (opname.difference !== 0) {
        await tx.stockTransaction.create({
          data: {
            itemId: opname.itemId,
            type: 'ADJUSTMENT',
            quantity: opname.difference,
            reference: `OPNAME-${opname.id.slice(0, 8)}`,
            notes: `Penyesuaian stok dari opname: ${notes || 'Tanpa catatan'}`,
            transactionDate: new Date(),
            createdById: session.user.id,
          },
        })
      }

      // Audit log for item stock change
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADJUST',
          entity: 'Item',
          entityId: opname.itemId,
          oldData: { currentStock: opname.systemStock },
          newData: { currentStock: opname.physicalStock },
        },
      })

      // Audit log for opname reconciliation
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'RECONCILE',
          entity: 'StockOpname',
          entityId: id,
          oldData: { status: opname.status },
          newData: { status: 'RECONCILED', notes },
        },
      })

      return { updatedItem, updatedOpname, reconciliation }
    })

    return NextResponse.json({
      message: 'Opname berhasil direkonsiliasi',
      data: result,
    })
  } catch (error) {
    console.error('POST /api/opname/[id]/reconcile error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}