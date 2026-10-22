import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, paginatedResponse } from "@/lib/api-response";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional().default(""),
  lowStockOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  isActive: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    const page = query.page;
    const limit = query.limit;
    const search = query.search;
    const lowStockOnly = query.lowStockOnly;
    const isActiveParam = query.isActive;

    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};
    // Only filter by isActive when explicitly requested.
    // "Semua" (all) on the frontend sends isActive=all → undefined → no filter.
    if (isActiveParam && isActiveParam !== "all") {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    if (lowStockOnly) {
      where.currentStock = { lte: prisma.item.fields.minStock };
    }

    // Summary over the full filtered dataset (not just the current page)
    const [total, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.count({
        where: {
          ...where,
          currentStock: { gt: 0, lte: prisma.item.fields.minStock },
        },
      }),
      prisma.item.count({
        where: { ...where, currentStock: { lte: 0 } },
      }),
    ]);

    const [items] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
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
      }),
    ]);

    // Calculate stock status for each item
    const itemsWithStatus = items.map((item) => ({
      ...item,
      stockStatus:
        item.currentStock <= 0
          ? "OUT_OF_STOCK"
          : item.currentStock <= item.minStock
            ? "LOW_STOCK"
            : "NORMAL",
      stockPercentage:
        item.minStock > 0
          ? Math.round((item.currentStock / item.minStock) * 100)
          : 100,
    }));

    // Calculate summary
    const summary = {
      totalItems: total,
      lowStockCount,
      outOfStockCount,
      normalCount: total - lowStockCount - outOfStockCount,
    };

    return NextResponse.json(
      paginatedResponse(
        itemsWithStatus,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary,
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
