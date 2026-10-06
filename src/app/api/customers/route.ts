import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().default(""),
  notes: z.string().default(""),
  measurements: z.record(z.string()).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const db = await getDb();
  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }
    : {};
  const list = await db
    .collection("customers")
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json(
    list.map((c) => ({
      id: c._id?.toString(),
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      measurements: c.measurements ?? {},
      updatedAt: c.updatedAt,
    })),
  );
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;
  const now = new Date();
  const doc = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address,
    notes: data.notes,
    measurements: data.measurements ?? {},
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const r = await db.collection("customers").insertOne(doc);
  return NextResponse.json({ id: r.insertedId.toHexString() });
}
