import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const CategorySchema = z.enum([
  "Electricity Bill",
  "Water Bill",
  "Shop Rent",
  "Material Cost",
  "Salary",
  "Miscellaneous",
]);

const patchSchema = z.object({
  category: CategorySchema.optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  const e = await db.collection("expenses").findOne({ _id: new ObjectId(id) });
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: e._id?.toString(),
    category: e.category,
    amount: e.amount,
    description: e.description ?? "",
    date:
      e.date instanceof Date
        ? e.date.toISOString().slice(0, 10)
        : String(e.date).slice(0, 10),
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
  const updates: Record<string, unknown> = {};
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.amount !== undefined) updates.amount = parsed.data.amount;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.date !== undefined) {
    const d = new Date(parsed.data.date);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    updates.date = d;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }
  const db = await getDb();
  const result = await db.collection("expenses").updateOne(
    { _id: new ObjectId(id) },
    { $set: updates },
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = await getDb();
  await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
