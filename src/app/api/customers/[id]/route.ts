import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  measurements: z.record(z.string()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  const c = await db.collection("customers").findOne({ _id: new ObjectId(id) });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const orders = await db
    .collection("orders")
    .find({ customerId: new ObjectId(id) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return NextResponse.json({
    id: c._id?.toString(),
    name: c.name,
    phone: c.phone,
    address: c.address,
    notes: c.notes,
    measurements: c.measurements ?? {},
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    orders: orders.map((o) => ({
      id: o._id?.toString(),
      dressType: o.dressType,
      deliveryDate: o.deliveryDate,
      status: o.status,
      totalAmount: o.totalAmount,
      advancePaid: o.advancePaid,
      remainingPayment: o.remainingPayment,
    })),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (updates.name) updates.name = String(updates.name).trim();
  if (updates.phone) updates.phone = String(updates.phone).trim();
  const db = await getDb();
  const result = await db
    .collection("customers")
    .updateOne({ _id: new ObjectId(id) }, { $set: updates });
  if (result.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  const oid = new ObjectId(id);
  await db.collection("orders").deleteMany({ customerId: oid });
  await db.collection("customers").deleteOne({ _id: oid });
  return NextResponse.json({ ok: true });
}
