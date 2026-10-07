import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-response'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const exportQuerySchema = z.object({
  ids: z.string().optional(),
  search: z.string().optional(),
  includeZeroStock: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['code', 'name', 'unit', 'currentStock', 'minStock', 'createdAt'])
    .default('currentStock'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = exportQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (query.ids) {
      where.id = { in: query.ids.split(',') }
    } else {
      if (query.includeZeroStock) {
        where.currentStock = { lte: prisma.item.fields.minStock }
      } else {
        where.AND = [
          { currentStock: { gt: 0 } },
          { currentStock: { lte: prisma.item.fields.minStock } },
        ]
      }

      if (query.search) {
        where.OR = [
          { code: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
        ]
      }
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        currentStock: true,
        minStock: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus: item.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      shortage: item.minStock - item.currentStock,
      stockPercentage: item.minStock > 0 ? Math.round((item.currentStock / item.minStock) * 100) : 0,
    }))

    // Generate CSV
    const headers = [
      'Kode',
      'Nama',
      'Satuan',
      'Stok Saat Ini',
      'Stok Minimum',
      'Kekurangan',
      '% dari Min',
      'Status',
      'Deskripsi',
      'Dibuat Pada',
      'Diperbarui Pada',
    ]

    const rows = itemsWithStatus.map(item => [
      item.code,
      item.name,
      item.unit,
      item.currentStock.toString(),
      item.minStock.toString(),
      item.shortage.toString(),
      `${item.stockPercentage}%`,
      item.stockStatus === 'OUT_OF_STOCK' ? 'Habis' : 'Rendah',
      item.description || '',
      new Date(item.createdAt).toLocaleString('id-ID'),
      new Date(item.updatedAt).toLocaleString('id-ID'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="low-stock-report-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}