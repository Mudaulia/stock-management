import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    // Auth server-side: role berasal dari DB, bukan token/client.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.stockTransaction.findMany({
      take: 5,
      orderBy: { transactionDate: "desc" },
      include: { item: { select: { id: true, name: true, code: true } } },
    });

    return NextResponse.json(successResponse(transactions));
  } catch (error) {
    return handleApiError(error);
  }
}
