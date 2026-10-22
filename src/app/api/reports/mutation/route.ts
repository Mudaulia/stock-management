import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType, type Prisma } from "@prisma/client";
import {
  handleApiError,
  paginatedResponse,
  successResponse,
} from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const dateString = z
  .string()
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Format tanggal tidak valid",
  });

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional().default(""),
  type: z.string().optional().default(""),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  itemId: z.string().optional(),
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
    const type = query.type;
    const startDate = query.startDate;
    const endDate = query.endDate;
    const itemId = query.itemId;

    const skip = (page - 1) * limit;

    const where: Prisma.StockTransactionWhereInput = {};

    if (search) {
      where.OR = [
        { item: { code: { contains: search } } },
        { item: { name: { contains: search } } },
        { reference: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (type && ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"].includes(type)) {
      where.type = type as TransactionType;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      // Inclusive end date: YYYY-MM-DD parsed as UTC midnight would exclude
      // transactions later that day (WIB timezone) — extend to end of day.
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: "desc" },
        include: {
          item: {
            select: { id: true, code: true, name: true, unit: true },
          },
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    // Calculate summary by type (no pagination — where only)
    const summary = await prisma.stockTransaction.groupBy({
      by: ["type"],
      where,
      _sum: { quantity: true },
      _count: { id: true },
    });

    const summaryByType = summary.reduce(
      (acc, curr) => {
        acc[curr.type] = {
          totalQuantity: curr._sum.quantity ?? 0,
          transactionCount: curr._count.id,
        };
        return acc;
      },
      {} as Record<string, { totalQuantity: number; transactionCount: number }>,
    );

    return NextResponse.json(
      paginatedResponse(
        transactions,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summaryByType,
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
