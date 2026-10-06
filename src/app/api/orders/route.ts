import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { type OrderStatus } from "@/lib/types";
const OrderStatusSchema = z.enum([
  "Pending",
  "Cutting",
  "Stitching",
  "Ready",
  "Delivered",
]);

const createSchema = z.object({
  customerId: z.string().min(1),
  dressType: z.string().min(1),
  deliveryDate: z.string().min(1),
  status: OrderStatusSchema.optional(),
  totalAmount: z.number().nonnegative(),
  advancePaid: z.number().nonnegative(),
  notes: z.string().default(""),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const customerId = searchParams.get("customerId");
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (customerId && ObjectId.isValid(customerId)) {
    filter.customerId = new ObjectId(customerId);
  }
  const list = await db
    .collection("orders")
    .find(filter)
    .sort({ deliveryDate: 1 })
    .limit(200)
    .toArray();
  const rawIds = list
    .map((o) => o.customerId)
    .filter((id): id is ObjectId => id instanceof ObjectId);
  const customers = await db
    .collection("customers")
    .find({
      _id: { $in: rawIds },
    })
    .toArray();
  const nameById = new Map(
    customers.map((c) => [c._id!.toString(), { name: c.name as string, phone: c.phone as string }]),
  );
  return NextResponse.json(
    list.map((o) => {
      const cust = nameById.get(o.customerId?.toString() ?? "");
      return {
      id: o._id?.toString(),
      customerId: o.customerId?.toString(),
      customerName: cust?.name ?? "—",
      customerPhone: cust?.phone ?? "",
      dressType: o.dressType,
      deliveryDate: o.deliveryDate,
      status: o.status,
      totalAmount: o.totalAmount,
      advancePaid: o.advancePaid,
      remainingPayment: o.remainingPayment,
      notes: o.notes,
      updatedAt: o.updatedAt,
    };
    }),
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
  if (!ObjectId.isValid(data.customerId)) {
    return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
  }
  const deliveryDate = new Date(data.deliveryDate);
  if (Number.isNaN(deliveryDate.getTime())) {
    return NextResponse.json({ error: "Invalid delivery date" }, { status: 400 });
  }
  const totalAmount = data.totalAmount;
  const advancePaid = Math.min(data.advancePaid, totalAmount);
  const remainingPayment = Math.max(0, totalAmount - advancePaid);
  const now = new Date();
  const doc = {
    customerId: new ObjectId(data.customerId),
    dressType: data.dressType.trim(),
    deliveryDate,
    status: (data.status ?? "Pending") as OrderStatus,
    totalAmount,
    advancePaid,
    remainingPayment,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const r = await db.collection("orders").insertOne(doc);
  return NextResponse.json({ id: r.insertedId.toHexString() });
}
