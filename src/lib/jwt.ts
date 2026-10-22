import { SignJWT, jwtVerify } from "jose";

/**
 * JWT helpers jose-only — aman diimpor dari middleware (Edge runtime).
 * JANGAN menambahkan import Prisma/bcrypt di file ini (nodejs-only deps).
 *
 * Function `verifyToken` "kanonik" tetap di `src/lib/auth.ts` yang
 * mendelegasikan ke sini agar tidak ada duplikasi logika.
 */

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  username: string;
}

// Placeholder yang dulu dibagikan lewat .env.example — tidak boleh dipakai
// di production karena secara efektif merupakan kredensial publik.
const JWT_SECRET_PLACEHOLDER =
  "your-super-secret-key-change-in-production-min-32-characters-long";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required. " +
        "Set a random secret with at least 32 characters.",
    );
  }

  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    secret === JWT_SECRET_PLACEHOLDER
  ) {
    throw new Error(
      "JWT_SECRET is still the documented placeholder value. " +
        "Generate a real secret (e.g. openssl rand -base64 48) before deploying.",
    );
  }

  return new TextEncoder().encode(secret);
}

const JWT_EXPIRY = "7d";

export async function createJwt(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.username !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

// Alias untuk middleware (nama sama dengan fungsi di lib/auth)
export const verifyToken = verifyJwt;
