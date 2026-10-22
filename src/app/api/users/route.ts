import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { z } from "zod";
import { handleApiError, paginatedResponse } from "@/lib/api-response";
import { verifyCSRF } from "@/lib/csrf";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Password minimal 8 karakter, wajib huruf & angka (TR-04)
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

const userCreateSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username hanya boleh huruf, angka, titik, garis bawah, dan strip",
    ),
  fullName: z.string().min(1, "Nama lengkap wajib diisi").max(255),
  role: z.enum(["ADMIN", "WAREHOUSE_STAFF", "VIEWER"]),
  password: passwordSchema,
});

const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["ADMIN", "WAREHOUSE_STAFF", "VIEWER"]).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

const userSelect: Prisma.UserSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = userQuerySchema.parse(Object.fromEntries(searchParams));

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { username: { contains: query.search } },
        { fullName: { contains: query.search } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: userSelect,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      paginatedResponse(users, {
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // CSRF protection
    const csrfResult = await verifyCSRF(request);
    if (!csrfResult.valid) {
      return csrfResult.response!;
    }

    const body = await request.json();
    const data = userCreateSchema.parse(body);

    const [emailExists, usernameExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      prisma.user.findUnique({ where: { username: data.username } }),
    ]);

    if (emailExists) {
      return NextResponse.json(
        { message: "Email sudah digunakan" },
        { status: 409 },
      );
    }

    if (usernameExists) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          fullName: data.fullName,
          role: data.role,
          passwordHash,
        },
        select: userSelect,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "USER",
          entityId: created.id,
          newData: created,
        },
      });

      return created;
    });

    return NextResponse.json(
      { data: newUser, message: "Pengguna berhasil ditambahkan" },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
