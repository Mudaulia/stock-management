import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { handleApiError, successResponse } from "@/lib/api-response";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json(successResponse(null, "Logout berhasil"));
  } catch (error) {
    return handleApiError(error);
  }
}
