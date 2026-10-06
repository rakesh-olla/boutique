import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getAuthSecretKey, SESSION_COOKIE_NAME } from "@/lib/auth-secret";

const DAY = 60 * 60 * 24;

function getSecret(): Uint8Array {
  const key = getAuthSecretKey();
  if (!key) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return key;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DAY,
  };
}

/** Prefer this in Route Handlers so Set-Cookie is always attached to the JSON response. */
export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export type SessionPayload = {
  sub: string;
  email: string;
  role: "admin";
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DAY}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    const role = payload.role as SessionPayload["role"] | undefined;
    if (!sub || !email || role !== "admin") return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function clearSessionCookieOnResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!t) return null;
  return verifySession(t);
}
