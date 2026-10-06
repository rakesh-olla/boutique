/** Shared JWT signing key + cookie name for middleware and Node routes. */

export const SESSION_COOKIE_NAME = "boutique_session";

/** Returns null if AUTH_SECRET is missing or too short (must match auth.ts rules). */
export function getAuthSecretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}
