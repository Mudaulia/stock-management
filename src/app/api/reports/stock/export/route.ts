import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-response'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const exportQuerySchema = z.object({
  ids: z.string().optional(),
  search: z.string().optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['code', 'name', 'unit', 'currentStock', 'minStock', 'createdAt'])
    .default('name'),
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

    const where: Record<string, unknown> = {}

    if (query.ids) {
      where.id = { in: query.ids.split(',') }
    } else {
      if (query.isActive !== undefined) {
        where.isActive = query.isActive
      }

      if (query.search) {
        where.OR = [
          { code: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      if (query.lowStockOnly) {
        where.currentStock = { lte: prisma.item.fields.minStock }
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

    // Calculate stock status for each item
    const itemsWithStatus = items.map(item => ({
      ...item,
      stockStatus: item.currentStock <= 0 ? 'OUT_OF_STOCK' :
                   item.currentStock <= item.minStock ? 'LOW_STOCK' : 'NORMAL',
      stockPercentage: item.minStock > 0 ? Math.round((item.currentStock / item.minStock) * 100) : 100,
    }))

    // Generate CSV
    const headers = [
      'Kode',
      'Nama',
      'Satuan',
      'Stok Saat Ini',
      'Stok Minimum',
      '% dari Min',
      'Status',
      'Deskripsi',
      'Aktif',
      'Dibuat Pada',
      'Diperbarui Pada',
    ]

    const rows = itemsWithStatus.map(item => [
      item.code,
      item.name,
      item.unit,
      item.currentStock.toString(),
      item.minStock.toString(),
      `${item.stockPercentage}%`,
      item.stockStatus === 'OUT_OF_STOCK' ? 'Habis' : item.stockStatus === 'LOW_STOCK' ? 'Rendah' : 'Normal',
      item.description || '',
      item.isActive ? 'Ya' : 'Tidak',
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
        'Content-Disposition': `attachment; filename="stock-report-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}