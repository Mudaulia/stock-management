import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'

export async function GET() {
  try {
    await requireAuth()

    const [totalItems, lowStockItems, outOfStockItems, recentStockIn, recentStockOut, pendingOpnames] = await Promise.all([
      prisma.item.count({ where: { isActive: true } }),
      prisma.item.count({ where: { isActive: true, currentStock: { gt: 0, lte: prisma.item.fields.minStock } } }),
      prisma.item.count({ where: { isActive: true, currentStock: { lte: 0 } } }),
      prisma.stockTransaction.count({ where: { type: 'STOCK_IN', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.stockTransaction.count({ where: { type: 'STOCK_OUT', transactionDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.stockOpname.count({ where: { status: 'PENDING' } }),
    ])

    return NextResponse.json(
      successResponse({
        totalItems,
        lowStockItems,
        outOfStockItems,
        recentStockIn,
        recentStockOut,
        pendingOpnames,
      })
    )
  } catch (error) {
    return handleApiError(error)
  }
}