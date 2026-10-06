import type { ObjectId } from "mongodb";

export const ORDER_STATUSES = [
  "Pending",
  "Cutting",
  "Stitching",
  "Ready",
  "Delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
  "Electricity Bill",
  "Water Bill",
  "Shop Rent",
  "Material Cost",
  "Salary",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type CustomerDoc = {
  _id?: ObjectId;
  name: string;
  phone: string;
  address: string;
  notes: string;
  measurements: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderDoc = {
  _id?: ObjectId;
  customerId: ObjectId;
  dressType: string;
  deliveryDate: Date;
  status: OrderStatus;
  totalAmount: number;
  advancePaid: number;
  remainingPayment: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseDoc = {
  _id?: ObjectId;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
};

export type UserDoc = {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: "admin";
  createdAt: Date;
};
