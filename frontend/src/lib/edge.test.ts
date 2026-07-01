import { describe, it, expect } from "vitest";
import {
  americanFromProb,
  deVig,
  gradeFromConfidence,
  impliedProbFromAmerican,
} from "./edge";

describe("impliedProbFromAmerican", () => {
  it("even money is 50%", () => {
    expect(impliedProbFromAmerican(100)).toBeCloseTo(0.5, 6);
    expect(impliedProbFromAmerican(-100)).toBeCloseTo(0.5, 6);
  });
  it("a -150 favorite implies 60%", () => {
    expect(impliedProbFromAmerican(-150)).toBeCloseTo(0.6, 6);
  });
  it("a +150 underdog implies 40%", () => {
    expect(impliedProbFromAmerican(150)).toBeCloseTo(0.4, 6);
  });
});

describe("americanFromProb", () => {
  it("50% -> -100", () => {
    expect(americanFromProb(0.5)).toBe(-100);
  });
  it("60% -> -150", () => {
    expect(americanFromProb(0.6)).toBe(-150);
  });
  it("40% -> +150", () => {
    expect(americanFromProb(0.4)).toBe(150);
  });
  it("round-trips with the implied-prob inverse", () => {
    const p = 0.642;
    expect(impliedProbFromAmerican(americanFromProb(p))).toBeCloseTo(p, 2);
  });
  it("clamps extreme probabilities to finite odds", () => {
    expect(Number.isFinite(americanFromProb(0))).toBe(true);
    expect(Number.isFinite(americanFromProb(1))).toBe(true);
  });
});

describe("deVig", () => {
  it("normalizes two implied probabilities to sum to 1", () => {
    const [a, b] = deVig(0.55, 0.52);
    expect(a + b).toBeCloseTo(1, 6);
    expect(a).toBeGreaterThan(b);
  });
  it("falls back to a coin flip on degenerate input", () => {
    expect(deVig(0, 0)).toEqual([0.5, 0.5]);
  });
});

describe("gradeFromConfidence", () => {
  it("buckets confidence into A..F", () => {
    expect(gradeFromConfidence(0.5)).toBe("A");
    expect(gradeFromConfidence(0.3)).toBe("B");
    expect(gradeFromConfidence(0.18)).toBe("C");
    expect(gradeFromConfidence(0.1)).toBe("D");
    expect(gradeFromConfidence(0.02)).toBe("F");
  });
});
