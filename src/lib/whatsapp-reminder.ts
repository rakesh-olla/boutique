import { parseDressItems } from "@/lib/dress-items";

/** India mobile → digits for wa.me (91XXXXXXXXXX). Returns null if invalid. */
export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return null;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeliveryDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dressSummary(dressType: string): string {
  const items = parseDressItems(dressType);
  if (items.length === 0) return "your order";
  if (items.length === 1) return items[0];
  return items.join(", ");
}

const shopName = () =>
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SHOP_NAME?.trim()) ||
  "Boutique";

export type ReminderKind = "payment" | "ready" | "delivery";

export function buildReminderMessage(
  kind: ReminderKind,
  opts: {
    customerName: string;
    dressType: string;
    deliveryDate: string | Date;
    remainingPayment: number;
    totalAmount?: number;
    status?: string;
  },
): string {
  const name = opts.customerName.trim() || "Sir/Madam";
  const item = dressSummary(opts.dressType);
  const dateStr = formatDeliveryDate(opts.deliveryDate);
  const shop = shopName();

  if (kind === "ready") {
    const due =
      opts.remainingPayment > 0
        ? `\nBaki rashi: ₹${formatInr(opts.remainingPayment)}`
        : "";
    return `Namaste ${name},\n\nAapka order (${item}) tayyar hai. Kripya shop par aakar collect karein.${due}\n\n— ${shop}`;
  }

  if (kind === "delivery") {
    const due =
      opts.remainingPayment > 0
        ? `\nPending payment: ₹${formatInr(opts.remainingPayment)}`
        : "";
    return `Namaste ${name},\n\nAapke order (${item}) ki delivery ${dateStr} ko scheduled hai.${due}\n\n— ${shop}`;
  }

  // payment (Khata-style due reminder)
  const total =
    opts.totalAmount != null && opts.totalAmount > 0
      ? `\nOrder total: ₹${formatInr(opts.totalAmount)}`
      : "";
  return `Namaste ${name},\n\nAapke order (${item}) par ₹${formatInr(opts.remainingPayment)} baaki hai.${total}\nDelivery: ${dateStr}\n\nKripya jaldi clear karein.\n\n— ${shop}`;
}
