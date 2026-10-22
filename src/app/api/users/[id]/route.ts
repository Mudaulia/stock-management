import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { z } from "zod";
import { handleApiError, successResponse } from "@/lib/api-response";
import { verifyCSRF } from "@/lib/csrf";

export const dynamic = "force-dynamic";

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

const userUpdateSchema = z.object({
  email: z.string().email("Format email tidak valid").optional(),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username hanya boleh huruf, angka, titik, garis bawah, dan strip",
    )
    .optional(),
  fullName: z.string().min(1, "Nama lengkap wajib diisi").max(255).optional(),
  role: z.enum(["ADMIN", "WAREHOUSE_STAFF", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

const userSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!target) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(successResponse(target));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
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

    const { id } = await params;
    const body = await request.json();
    const data = userUpdateSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    // Proteksi self-lockout: admin tidak boleh menonaktifkan/menurunkan dirinya sendiri
    if (
      user.id === id &&
      (data.isActive === false || (data.role && data.role !== "ADMIN"))
    ) {
      return NextResponse.json(
        {
          message: "Tidak dapat menonaktifkan atau mengubah role akun sendiri",
        },
        { status: 400 },
      );
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        return NextResponse.json(
          { message: "Email sudah digunakan" },
          { status: 409 },
        );
      }
    }

    if (data.username && data.username !== existing.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (usernameExists) {
        return NextResponse.json(
          { message: "Username sudah digunakan" },
          { status: 409 },
        );
      }
    }

    const { password, ...rest } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const newData: Record<string, unknown> = { ...rest };

      if (password) {
        newData.passwordHash = await hashPassword(password);
      }

      const result = await tx.user.update({
        where: { id },
        data: newData,
        select: userSelect,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          entity: "USER",
          entityId: id,
          oldData: {
            email: existing.email,
            username: existing.username,
            fullName: existing.fullName,
            role: existing.role,
            isActive: existing.isActive,
          },
          newData: {
            email: result.email,
            username: result.username,
            fullName: result.fullName,
            role: result.role,
            isActive: result.isActive,
          },
        },
      });

      return result;
    });

    return NextResponse.json(
      successResponse(updated, "Pengguna berhasil diperbarui"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
