import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const itemUpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  unit: z.string().min(1).max(50).optional(),
  minStock: z.number().int().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const item = await prisma.item.findUnique({
      where: { id },
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

    if (!item) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Get item error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE_STAFF')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = itemUpdateSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.item.findUnique({ where: { id } })
    if (!existingItem) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 })
    }

    // Check unique code if changing
    if (data.code && data.code !== existingItem.code) {
      const codeExists = await prisma.item.findUnique({ where: { code: data.code } })
      if (codeExists) {
        return NextResponse.json({ message: 'Kode barang sudah digunakan' }, { status: 400 })
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data,
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'ITEM',
        entityId: item.id,
        oldData: existingItem,
        newData: item,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validasi gagal', errors: error.errors }, { status: 400 })
    }
    console.error('Update item error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingItem = await prisma.item.findUnique({ where: { id } })
    if (!existingItem) {
      return NextResponse.json({ message: 'Barang tidak ditemukan' }, { status: 404 })
    }

    // Soft delete
    const item = await prisma.item.update({
      where: { id },
      data: { isActive: false },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'ITEM',
        entityId: item.id,
        oldData: existingItem,
        newData: item,
      },
    })

    return NextResponse.json({ message: 'Barang berhasil dihapus' })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}