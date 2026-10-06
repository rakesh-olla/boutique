import { NextResponse } from "next/server";
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

const createSchema = z.object({
  category: CategorySchema,
  amount: z.number().positive(),
  description: z.string().default(""),
  date: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }
  const list = await db
    .collection("expenses")
    .find(filter)
    .sort({ date: -1 })
    .limit(500)
    .toArray();
  return NextResponse.json(
    list.map((e) => ({
      id: e._id?.toString(),
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date,
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
  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const now = new Date();
  const doc = {
    category: data.category,
    amount: data.amount,
    description: data.description,
    date,
    createdAt: now,
  };
  const db = await getDb();
  const r = await db.collection("expenses").insertOne(doc);
  return NextResponse.json({ id: r.insertedId.toHexString() });
}
