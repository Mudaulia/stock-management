import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, paginatedResponse } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional().default(""),
  includeZeroStock: z
    .string()
    .optional()
    .transform((val) => val === "true"),
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
    const includeZeroStock = query.includeZeroStock;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (includeZeroStock) {
      where.currentStock = { lte: prisma.item.fields.minStock };
    } else {
      where.AND = [
        { currentStock: { gt: 0 } },
        { currentStock: { lte: prisma.item.fields.minStock } },
      ];
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [items, total, totalOutOfStock] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { currentStock: "asc" },
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
      prisma.item.count({ where }),
      // Summary over the full filtered dataset (not just the current page)
      prisma.item.count({ where: { ...where, currentStock: { lte: 0 } } }),
    ]);

    const itemsWithStatus = items.map((item) => ({
      ...item,
      stockStatus: item.currentStock <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      shortage: item.minStock - item.currentStock,
      stockPercentage:
        item.minStock > 0
          ? Math.round((item.currentStock / item.minStock) * 100)
          : 0,
    }));

    // Calculate summary
    const summary = {
      totalLowStock: total - totalOutOfStock,
      totalOutOfStock,
      totalItems: total,
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
