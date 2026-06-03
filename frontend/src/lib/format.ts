// Pure formatting helpers (unit-tested).

export function fmtOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export function pct(value: number | string, digits = 1): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${(n * 100).toFixed(digits)}%`;
}

export function americanToDecimal(american: number): number {
  return american >= 100 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
}
