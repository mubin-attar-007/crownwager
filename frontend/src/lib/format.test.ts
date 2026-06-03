import { describe, expect, it } from "vitest";
import { americanToDecimal, fmtOdds, pct } from "./format";

describe("format helpers", () => {
  it("formats american odds with sign", () => {
    expect(fmtOdds(150)).toBe("+150");
    expect(fmtOdds(-110)).toBe("-110");
  });

  it("formats percentages", () => {
    expect(pct(0.6)).toBe("60.0%");
    expect(pct("0.555", 2)).toBe("55.50%");
  });

  it("converts american to decimal", () => {
    expect(americanToDecimal(100)).toBeCloseTo(2.0);
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
  });
});
