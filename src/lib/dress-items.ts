/**
 * Split dress / item text into separate entries for list display.
 * Supports: one item per line, and comma / semicolon / pipe on the same line (e.g. "Lehenga, Blouse").
 */
export function parseDressItems(dressType: string): string[] {
  const lines = dressType
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items: string[] = [];
  const splitLine = (line: string) =>
    line
      .split(/\s*[,;|]\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  for (const line of lines) {
    if (/\s*[,;|]\s*/.test(line)) {
      items.push(...splitLine(line));
    } else {
      items.push(line);
    }
  }

  return items;
}
