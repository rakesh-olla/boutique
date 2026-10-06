import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import type { OrderStatus } from "@/lib/types";
const OrderStatusSchema = z.enum([
  "Pending",
  "Cutting",
  "Stitching",
  "Ready",
  "Delivered",
]);

const patchSchema = z.object({
  dressType: z.string().min(1).optional(),
  deliveryDate: z.string().optional(),
  status: OrderStatusSchema.optional(),
  totalAmount: z.number().nonnegative().optional(),
  advancePaid: z.number().nonnegative().optional(),
  /** If set, advance is derived as total − remaining (capped). Takes precedence over advancePaid when both sent. */
  remainingPayment: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  const o = await db.collection("orders").findOne({ _id: new ObjectId(id) });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let customerName = "";
  let customerPhone = "";
  if (o.customerId) {
    const c = await db.collection("customers").findOne({ _id: o.customerId as ObjectId });
    customerName = (c?.name as string) ?? "";
    customerPhone = (c?.phone as string) ?? "";
  }
  return NextResponse.json({
    id: o._id?.toString(),
    customerId: o.customerId?.toString(),
    customerName,
    customerPhone,
    dressType: o.dressType,
    deliveryDate: o.deliveryDate,
    status: o.status,
    totalAmount: o.totalAmount,
    advancePaid: o.advancePaid,
    remainingPayment: o.remainingPayment,
    notes: o.notes,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
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
  const db = await getDb();
  const existing = await db.collection("orders").findOne({ _id: new ObjectId(id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let totalAmount = (existing.totalAmount as number) ?? 0;
  let advancePaid = (existing.advancePaid as number) ?? 0;
  if (parsed.data.totalAmount !== undefined) totalAmount = parsed.data.totalAmount;

  if (parsed.data.remainingPayment !== undefined) {
    let rem = parsed.data.remainingPayment;
    rem = Math.max(0, rem);
    rem = Math.min(rem, totalAmount);
    advancePaid = totalAmount - rem;
  } else if (parsed.data.advancePaid !== undefined) {
    advancePaid = parsed.data.advancePaid;
    advancePaid = Math.min(advancePaid, totalAmount);
  }
  const remainingPayment = Math.max(0, totalAmount - advancePaid);

  const updates: Record<string, unknown> = {
    remainingPayment,
    advancePaid,
    totalAmount,
    updatedAt: new Date(),
  };
  if (parsed.data.dressType !== undefined) updates.dressType = parsed.data.dressType.trim();
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status as OrderStatus;
  if (parsed.data.deliveryDate !== undefined) {
    const d = new Date(parsed.data.deliveryDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
    }
    updates.deliveryDate = d;
  }

  await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: updates });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
