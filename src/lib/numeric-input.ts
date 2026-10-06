/** Allow only digits and at most one `.` for ₹ / decimal amounts. */
export function sanitizeDecimalString(raw: string): string {
  let out = "";
  let seenDot = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else if (ch === "." && !seenDot) {
      seenDot = true;
      out += ch;
    }
  }
  return out;
}

/** Digits only (phone, etc.). */
export function sanitizeDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}
