import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OpnameStatus, type Prisma } from "@prisma/client";
import { z } from "zod";
import {
  ApiError,
  handleApiError,
  paginatedResponse,
  successResponse,
} from "@/lib/api-response";
import { verifyCSRF } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const opnameSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  physicalStock: z.coerce
    .number()
    .int()
    .nonnegative("Stok fisik tidak boleh negatif"),
  notes: z.string().optional(),
  opnameDate: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      "Format tanggal tidak valid",
    ),
});

const reconcileSchema = z.object({
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Validasi query params via zod (konsisten dengan report routes):
    // limit dibatasi, page/limit selalu angka valid.
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        search: z.string().optional().default(""),
        status: z.string().optional().default(""),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .parse(Object.fromEntries(searchParams));
    const page = query.page;
    const limit = query.limit;
    const search = query.search;
    const status = query.status;
    const startDate = query.startDate;
    const endDate = query.endDate;

    const skip = (page - 1) * limit;

    const where: Prisma.StockOpnameWhereInput = {};

    if (search) {
      where.OR = [
        { item: { code: { contains: search } } },
        { item: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    if (status && ["PENDING", "RECONCILED", "CANCELLED"].includes(status)) {
      where.status = status as OpnameStatus;
    }

    if (startDate || endDate) {
      where.opnameDate = {};
      const parsedStart = startDate ? new Date(startDate) : null;
      const parsedEnd = endDate ? new Date(endDate) : null;
      if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
        where.opnameDate.gte = parsedStart;
      }
      if (parsedEnd && !Number.isNaN(parsedEnd.getTime())) {
        where.opnameDate.lte = parsedEnd;
      }
    }

    const [opnames, total] = await Promise.all([
      prisma.stockOpname.findMany({
        where,
        skip,
        take: limit,
        orderBy: { opnameDate: "desc" },
        include: {
          item: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
              currentStock: true,
            },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
          reconciliation: {
            select: {
              id: true,
              adjustedAt: true,
              adjustedBy: { select: { fullName: true } },
            },
          },
        },
      }),
      prisma.stockOpname.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(opnames, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = await verifyCSRF(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only ADMIN and WAREHOUSE_STAFF can create opname
    if (user.role !== "ADMIN" && user.role !== "WAREHOUSE_STAFF") {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = opnameSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: validation.error.errors },
        { status: 400 },
      );
    }

    const { itemId, physicalStock, notes, opnameDate } = validation.data;

    // Check if item exists and is active
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { message: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!item.isActive) {
      return NextResponse.json(
        { message: "Barang tidak aktif" },
        { status: 400 },
      );
    }

    // Check if there's already a pending opname for this item
    const existingPending = await prisma.stockOpname.findFirst({
      where: {
        itemId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          message:
            "Masih ada opname pending untuk barang ini. Selesaikan atau batalkan terlebih dahulu.",
        },
        { status: 400 },
      );
    }

    const systemStock = item.currentStock;
    const difference = physicalStock - systemStock;

    const opname = await prisma.$transaction(async (tx) => {
      /*
       * Serialize concurrent opname creation per item:
       * lock the item row so two parallel POSTs cannot both
       * pass the PENDING check below (check-then-write race).
       */
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM items WHERE id = ${itemId} FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new ApiError("Barang tidak ditemukan", 404);
      }

      // Re-check PENDING uniqueness inside the lock.
      const existingPending = await tx.stockOpname.findFirst({
        where: { itemId, status: "PENDING" },
      });
      if (existingPending) {
        throw new ApiError(
          "Masih ada opname pending untuk barang ini. Selesaikan atau batalkan terlebih dahulu.",
          400,
        );
      }

      const newOpname = await tx.stockOpname.create({
        data: {
          itemId,
          systemStock,
          physicalStock,
          difference,
          notes,
          opnameDate: new Date(opnameDate),
          createdById: user.id,
          status: "PENDING",
        },
        include: {
          item: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
              currentStock: true,
            },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "StockOpname",
          entityId: newOpname.id,
          newData: {
            itemId,
            systemStock,
            physicalStock,
            difference,
            notes,
            opnameDate,
            status: "PENDING",
          },
        },
      });

      return newOpname;
    });

    return NextResponse.json(successResponse(opname), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
