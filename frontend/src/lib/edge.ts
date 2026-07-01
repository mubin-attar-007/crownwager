// Pure betting-edge math (unit-tested).
//
// For a single model probability, the model's own estimate IS the no-vig view, so the
// "fair odds" are simply the American price a fair (vig-free) book would post for that
// probability. Comparing that to the book's offered price is the core +EV credibility move.

/** Win probability a book's American price implies (includes the book's vig). */
export function impliedProbFromAmerican(american: number): number {
  if (american < 0) return -american / (-american + 100);
  return 100 / (american + 100);
}

/** The fair American odds for a given win probability (0..1). */
export function americanFromProb(p: number): number {
  const q = Math.min(0.99, Math.max(0.01, p));
  if (q >= 0.5) return -Math.round((q / (1 - q)) * 100);
  return Math.round(((1 - q) / q) * 100);
}

/** Remove vig from a two-way market by normalizing both implied probabilities to sum to 1. */
export function deVig(impliedA: number, impliedB: number): [number, number] {
  const total = impliedA + impliedB;
  if (total <= 0) return [0.5, 0.5];
  return [impliedA / total, impliedB / total];
}

export type Grade = "A" | "B" | "C" | "D" | "F";

/**
 * Bucket a model confidence (0..1, where confidence = |2·p − 1|) into an honest letter
 * grade. Buckets, not raw numbers, so the signal reads as a considered call.
 */
export function gradeFromConfidence(confidence: number): Grade {
  if (confidence >= 0.4) return "A";
  if (confidence >= 0.25) return "B";
  if (confidence >= 0.15) return "C";
  if (confidence >= 0.07) return "D";
  return "F";
}
