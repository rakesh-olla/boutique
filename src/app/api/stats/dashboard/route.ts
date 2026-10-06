import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 14);

  const [totalOrders, pendingPaymentsAgg, monthlyIncomeAgg, monthlyExpensesAgg, upcomingDeliveries] =
    await Promise.all([
      db.collection("orders").countDocuments(),
      db
        .collection("orders")
        .aggregate([
          { $match: { remainingPayment: { $gt: 0 }, status: { $ne: "Delivered" } } },
          { $group: { _id: null, sum: { $sum: "$remainingPayment" } } },
        ])
        .toArray(),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              status: "Delivered",
              updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ])
        .toArray(),
      db
        .collection("expenses")
        .aggregate([
          { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: null, sum: { $sum: "$amount" } } },
        ])
        .toArray(),
      db
        .collection("orders")
        .find({
          deliveryDate: { $gte: now, $lte: weekAhead },
          status: { $nin: ["Delivered"] },
        })
        .sort({ deliveryDate: 1 })
        .limit(8)
        .toArray(),
    ]);

  const pendingPayments = pendingPaymentsAgg[0]?.sum ?? 0;
  const monthlyIncome = monthlyIncomeAgg[0]?.total ?? 0;
  const monthlyExpenses = monthlyExpensesAgg[0]?.sum ?? 0;

  const deliveredThisMonth = await db.collection("orders").countDocuments({
    status: "Delivered",
    updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  return NextResponse.json({
    totalOrders,
    pendingPayments,
    monthlyIncome,
    monthlyExpenses,
    profit: monthlyIncome - monthlyExpenses,
    deliveredThisMonth,
    upcomingDeliveries: upcomingDeliveries.map((o) => ({
      id: o._id?.toString(),
      dressType: o.dressType,
      deliveryDate: o.deliveryDate,
      status: o.status,
      customerId: o.customerId?.toString(),
    })),
  });
}
