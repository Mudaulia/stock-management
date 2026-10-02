import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { handleApiError, successResponse } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

const reconcileSchema = z.object({
  notes: z.string().optional(),
})

class StaleOpnameError extends Error {
  constructor() {
    super(
      'Stok sistem sudah berubah sejak opname dibuat. ' +
      'Opname harus dibuat ulang sebelum rekonsiliasi.'
    )
    this.name = 'StaleOpnameError'
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          message:
            'Hanya ADMIN yang dapat merekonsiliasi opname',
        },
        { status: 403 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const validation =
      reconcileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validasi gagal', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { notes } = validation.data

    const opname =
      await prisma.stockOpname.findUnique({
        where: {
          id,
        },
        include: {
          item: true,
        },
      })

    if (!opname) {
      return NextResponse.json(
        {
          message: 'Opname tidak ditemukan',
        },
        { status: 404 }
      )
    }

    if (opname.status !== 'PENDING') {
      return NextResponse.json(
        {
          message:
            'Hanya opname dengan status PENDING yang dapat direkonsiliasi',
        },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Critical snapshot consistency check.
         *
         * Reconciliation is only allowed if the item's current
         * stock is still equal to the systemStock captured when
         * the opname was created.
         *
         * Example:
         *
         * Opname snapshot = 100
         * Later Stock In = +20
         * Current stock = 120
         *
         * Reconciliation must NOT blindly change 120 -> physicalStock.
         */
        const stockUpdate =
          await tx.item.updateMany({
            where: {
              id: opname.itemId,
              currentStock: opname.systemStock,
            },
            data: {
              currentStock: opname.physicalStock,
            },
          })

        if (stockUpdate.count !== 1) {
          throw new StaleOpnameError()
        }

        const updatedOpname =
          await tx.stockOpname.update({
            where: {
              id,
            },
            data: {
              status: 'RECONCILED',
            },
          })

        const reconciliation =
          await tx.stockReconciliation.create({
            data: {
              opnameId: id,
              adjustedById: user.id,
              notes,
            },
          })

        /*
         * ADJUSTMENT quantity represents a signed delta:
         *
         * +10 = stock increase
         * -10 = stock decrease
         *
         * STOCK_IN and STOCK_OUT remain positive quantities.
         *
         * No schema migration is required because Prisma Int
         * already permits negative values.
         */
        if (opname.difference !== 0) {
          await tx.stockTransaction.create({
            data: {
              itemId: opname.itemId,
              type: 'ADJUSTMENT',
              quantity: opname.difference,
              reference:
                `OPNAME-${opname.id.slice(0, 8)}`,
              notes:
                `Penyesuaian stok dari opname: ${
                  notes || 'Tanpa catatan'
                }`,
              transactionDate: new Date(),
              createdById: user.id,
            },
          })
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'ADJUST',
            entity: 'Item',
            entityId: opname.itemId,
            oldData: {
              currentStock: opname.systemStock,
            },
            newData: {
              currentStock: opname.physicalStock,
            },
          },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'RECONCILE',
            entity: 'StockOpname',
            entityId: id,
            oldData: {
              status: opname.status,
            },
            newData: {
              status: 'RECONCILED',
              notes,
            },
          },
        })

        return {
          updatedOpname,
          reconciliation,
        }
      }
    )

    return NextResponse.json(
      successResponse(result, undefined),
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
