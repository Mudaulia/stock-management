"use client";

/**
 * Client-side CSRF token store.
 *
 * Token CSRF diterima dari header `x-csrf-token` pada response login (dan
 * response 403 "Invalid or expired CSRF token" yang menyertakan token segar).
 * Cookie `csrf-token` bersifat httpOnly sehingga TIDAK bisa dibaca JS —
 * karena itu token disimpan di sini (in-memory + sessionStorage agar tetap
 * tersedia setelah full page reload) dan dikirim via header `x-csrf-token`
 * pada setiap request non-GET.
 */

const STORAGE_KEY = "csrf-token";

let inMemoryToken: string | null = null;

function readStoredToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === "undefined") return null;
  try {
    inMemoryToken = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    inMemoryToken = null;
  }
  return inMemoryToken;
}

export function getCSRFClientToken(): string | null {
  return readStoredToken();
}

export function setCSRFClientToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage tidak tersedia (mis. private mode) — in-memory saja.
  }
}

/**
 * Ambil token dari response header `x-csrf-token` bila ada.
 * Dipanggil oleh fetch wrapper untuk setiap response.
 */
export function captureCSRFTokenFromResponse(response: Response): void {
  const token = response.headers.get("x-csrf-token");
  if (token) {
    setCSRFClientToken(token);
  }
}

/** Header CSRF untuk request non-GET (bila token tersedia). */
export function csrfHeader(): Record<string, string> {
  const token = readStoredToken();
  return token ? { "x-csrf-token": token } : {};
}
