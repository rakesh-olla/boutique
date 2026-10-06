"use client";

import { MessageCircle } from "lucide-react";
import {
  buildReminderMessage,
  buildWhatsAppUrl,
  type ReminderKind,
} from "@/lib/whatsapp-reminder";

const labels: Record<ReminderKind, string> = {
  payment: "Payment reminder",
  ready: "Ready to collect",
  delivery: "Delivery reminder",
};

type Props = {
  phone: string;
  customerName: string;
  dressType: string;
  deliveryDate: string | Date;
  remainingPayment: number;
  totalAmount?: number;
  status?: string;
  kind: ReminderKind;
  /** Use inside list rows so parent Link does not fire */
  stopPropagation?: boolean;
  className?: string;
  compact?: boolean;
};

export function WhatsAppReminderButton({
  phone,
  customerName,
  dressType,
  deliveryDate,
  remainingPayment,
  totalAmount,
  status,
  kind,
  stopPropagation,
  className = "",
  compact = false,
}: Props) {
  const message = buildReminderMessage(kind, {
    customerName,
    dressType,
    deliveryDate,
    remainingPayment,
    totalAmount,
    status,
  });
  const href = buildWhatsAppUrl(phone, message);

  if (!href) {
    return (
      <span
        className={`text-xs text-[var(--muted)] ${className}`}
        title="Valid 10-digit mobile number required"
      >
        No WhatsApp
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 font-medium text-[#128C7E] transition hover:bg-[#25D366]/20 active:opacity-90 dark:text-[#25D366] ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
      } ${className}`}
    >
      <MessageCircle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      {compact ? "WhatsApp" : labels[kind]}
    </a>
  );
}
