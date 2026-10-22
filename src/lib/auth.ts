import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { generateCSRFToken } from "./csrf";
import { createJwt, verifyJwt, JWTPayload } from "./jwt";

export type { JWTPayload };

const AUTH_COOKIE_NAME = "auth-token";

export interface ServerSession {
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return createJwt(payload);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  return verifyJwt(token);
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function setSession(payload: JWTPayload): Promise<string> {
  const token = await createToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Generate and set CSRF token
  const csrfToken = await generateCSRFToken(payload.userId);
  cookieStore.set("csrf-token", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  return csrfToken;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete("csrf-token");
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

/**
 * Compatibility helper for API routes that use a session-shaped object.
 *
 * This project does not use NextAuth. The session is backed by the
 * application's own JWT cookie, so this helper intentionally exposes
 * the same shape expected by the existing API consumers:
 *
 * {
 *   user: {
 *     id,
 *     role,
 *     ...
 *   }
 * }
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    user,
  };
}

export function requireAuth(allowedRoles?: string[]) {
  return async () => {
    const user = await getCurrentUser();

    if (!user) {
      return {
        user: null,
        error: "Unauthorized",
      };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        error: "Forbidden",
      };
    }

    return {
      user,
      error: null,
    };
  };
}
