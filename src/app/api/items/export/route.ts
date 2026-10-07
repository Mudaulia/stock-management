import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError } from '@/lib/api-response'
import { verifyCSRF } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

const exportQuerySchema = z.object({
  ids: z.string().optional(),
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

    const query = exportQuerySchema.parse(
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
      id?: { in: string[] }
    } = {}

    if (query.ids) {
      where.id = { in: query.ids.split(',') }
    } else {
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
    }

    const items = await prisma.item.findMany({
      where,
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
    })

    // Generate CSV
    const headers = [
      'Kode',
      'Nama',
      'Satuan',
      'Stok Saat Ini',
      'Stok Minimum',
      'Deskripsi',
      'Status',
      'Dibuat Pada',
      'Diperbarui Pada',
    ]

    const rows = items.map((item) => [
      item.code,
      item.name,
      item.unit,
      item.currentStock.toString(),
      item.minStock.toString(),
      item.description || '',
      item.isActive ? 'Aktif' : 'Nonaktif',
      new Date(item.createdAt).toLocaleString('id-ID'),
      new Date(item.updatedAt).toLocaleString('id-ID'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="items-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}