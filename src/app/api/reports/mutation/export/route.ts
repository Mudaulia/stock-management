import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-response'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const exportQuerySchema = z.object({
  ids: z.string().optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  itemId: z.string().optional(),
  sortBy: z
    .enum(['transactionDate', 'type', 'quantity', 'reference', 'createdAt'])
    .default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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
      if (query.search) {
        where.OR = [
          { item: { code: { contains: query.search, mode: 'insensitive' } } },
          { item: { name: { contains: query.search, mode: 'insensitive' } } },
          { reference: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      if (query.type) {
        where.type = query.type
      }

      if (query.itemId) {
        where.itemId = query.itemId
      }

      if (query.startDate || query.endDate) {
        where.transactionDate = {}
        const transactionDate = where.transactionDate as Record<string, Date>
        if (query.startDate) transactionDate.gte = new Date(query.startDate)
        if (query.endDate) transactionDate.lte = new Date(query.endDate)
      }
    }

    const transactions = await prisma.stockTransaction.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      include: {
        item: {
          select: { id: true, code: true, name: true, unit: true },
        },
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    })

    // Generate CSV
    const headers = [
      'Tanggal',
      'Tipe',
      'Barang (Kode - Nama)',
      'Satuan',
      'Jumlah',
      'Referensi',
      'Catatan',
      'Dibuat Oleh',
      'Dibuat Pada',
    ]

    const rows = transactions.map(tx => [
      new Date(tx.transactionDate).toLocaleString('id-ID'),
      tx.type === 'STOCK_IN' ? 'Masuk' : tx.type === 'STOCK_OUT' ? 'Keluar' : 'Penyesuaian',
      `${tx.item.code} - ${tx.item.name}`,
      tx.item.unit,
      (tx.type === 'STOCK_IN' ? '+' : tx.type === 'STOCK_OUT' ? '-' : '') + tx.quantity.toString(),
      tx.reference || '',
      tx.notes || '',
      tx.createdBy.fullName,
      new Date(tx.createdAt).toLocaleString('id-ID'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mutation-report-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}