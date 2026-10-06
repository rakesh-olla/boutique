import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { attachSessionCookie, signSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({
      email: email.toLowerCase().trim(),
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash as string);
    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const id = (user._id as ObjectId).toHexString();
    const token = await signSession({
      sub: id,
      email: user.email as string,
      role: "admin",
    });
    const res = NextResponse.json({ ok: true });
    attachSessionCookie(res, token);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[auth/login]", err);
    return NextResponse.json(
      {
        error:
          message.includes("MONGODB_URI") || message.includes("Mongo")
            ? "Database not configured. Set MONGODB_URI in .env"
            : message.includes("AUTH_SECRET")
              ? "Server misconfiguration: set AUTH_SECRET (min 16 characters) in .env"
              : "Login failed",
      },
      { status: 500 },
    );
  }
}
