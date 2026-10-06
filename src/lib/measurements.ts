export function parseMeasurements(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export function stringifyMeasurements(m: Record<string, string>): string {
  return Object.entries(m)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
