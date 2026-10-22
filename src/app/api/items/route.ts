import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  handleApiError,
  paginatedResponse,
  successResponse,
} from "@/lib/api-response";
import { verifyCSRF } from "@/lib/csrf";
import { UNIT_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const unitSchema = z
  .string()
  .transform((val) => val.trim().toUpperCase())
  .pipe(
    z.enum(UNIT_OPTIONS, {
      message: `Satuan harus salah satu dari: ${UNIT_OPTIONS.join(", ")}`,
    }),
  );

const itemCreateSchema = z.object({
  code: z.string().min(1, "Kode barang wajib diisi").max(50),
  name: z.string().min(1, "Nama barang wajib diisi").max(255),
  unit: unitSchema,
  minStock: z.number().int().min(0).default(0),

  /*
   * currentStock is allowed only when creating a brand-new item.
   *
   * It is recorded as STOCK_IN below so every initial quantity
   * has an inventory transaction.
   */
  currentStock: z.number().int().min(0).default(0),

  description: z.string().optional(),
});

const itemQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  sortBy: z
    .enum(["code", "name", "unit", "currentStock", "minStock", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const query = itemQuerySchema.parse(Object.fromEntries(searchParams));

    /*
     * No mode: 'insensitive' — not supported by MySQL connector;
     * collation is case-insensitive by default (same as reports routes).
     */
    const where: {
      OR?: Array<{
        code?: { contains: string };
        name?: { contains: string };
      }>;
      isActive?: boolean;
    } = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
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
      }),
      prisma.item.count({
        where,
      }),
    ]);

    return NextResponse.json(
      paginatedResponse(items, {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResult = await verifyCSRF(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(body);

    /*
     * Soft delete only — aligns with single-item delete.
     *
     * Stock transactions and stock opnames are permanent history
     * (see .trae/rules/backend/inventory-rules.md) and must never be deleted.
     */
    const deletedCount = await prisma.$transaction(async (tx) => {
      const items = await tx.item.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true, code: true, name: true },
      });

      if (items.length === 0) {
        return 0;
      }

      await tx.item.updateMany({
        where: { id: { in: items.map((item) => item.id) } },
        data: { isActive: false },
      });

      // Create audit logs
      for (const item of items) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE",
            entity: "ITEM",
            entityId: item.id,
            oldData: item,
          },
        });
      }

      // Hanya hitung item yang benar-benar dinonaktifkan
      return items.length;
    });

    return NextResponse.json(
      successResponse({
        deletedCount,
        skippedCount: ids.length - deletedCount,
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

    if (!user || (user.role !== "ADMIN" && user.role !== "WAREHOUSE_STAFF")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = itemCreateSchema.parse(body);

    const existing = await prisma.item.findUnique({
      where: {
        code: data.code,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Kode barang sudah digunakan",
        },
        { status: 400 },
      );
    }

    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.item.create({
        data: {
          code: data.code,
          name: data.name,
          unit: data.unit,
          minStock: data.minStock,
          currentStock: data.currentStock,
          description: data.description,
        },
      });

      /*
       * Initial stock is represented as a real inventory
       * movement. This keeps currentStock aligned with
       * the transaction history from the first day.
       */
      if (data.currentStock > 0) {
        await tx.stockTransaction.create({
          data: {
            itemId: createdItem.id,
            type: "STOCK_IN",
            quantity: data.currentStock,
            reference: `INITIAL-${createdItem.id.slice(0, 8)}`,
            notes: "Stok awal saat pembuatan barang",
            transactionDate: new Date(),
            createdById: user.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "ITEM",
          entityId: createdItem.id,
          newData: createdItem,
        },
      });

      return createdItem;
    });

    return NextResponse.json(successResponse(item), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
