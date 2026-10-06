import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month=YYYY-MM required" }, { status: 400 });
  }
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const db = await getDb();

  const [incomeAgg, expenseAgg, pendingAgg, deliveredCount] = await Promise.all([
    db
      .collection("orders")
      .aggregate([
        {
          $match: {
            status: "Delivered",
            updatedAt: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ])
      .toArray(),
    db
      .collection("expenses")
      .aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("orders")
      .aggregate([
        { $match: { remainingPayment: { $gt: 0 }, status: { $ne: "Delivered" } } },
        { $group: { _id: null, sum: { $sum: "$remainingPayment" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection("orders").countDocuments({
      status: "Delivered",
      updatedAt: { $gte: start, $lte: end },
    }),
  ]);

  const income = incomeAgg[0]?.total ?? 0;
  const expenses = expenseAgg[0]?.total ?? 0;

  const byCategory = await db
    .collection("expenses")
    .aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ])
    .toArray();

  return NextResponse.json({
    month,
    income,
    expenses,
    profit: income - expenses,
    pendingPayments: pendingAgg[0]?.sum ?? 0,
    pendingOrdersCount: pendingAgg[0]?.count ?? 0,
    deliveredCount,
    expensesByCategory: Object.fromEntries(
      byCategory.map((r) => [r._id as string, r.total as number]),
    ),
  });
}
