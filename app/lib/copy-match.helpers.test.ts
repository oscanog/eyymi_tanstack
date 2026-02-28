import { describe, expect, it } from "vitest";
import {
  clampProgressRatio,
  describeRingArc,
  getProgressRatio,
  getRingHeadAngle,
  getRingPoint,
  shouldShowNoCandidatesDecision,
} from "./copy-match.helpers";

describe("copy match helpers", () => {
  it("computes bounded progress ratio", () => {
    expect(getProgressRatio(1000, 1000, 2000)).toBe(0);
    expect(getProgressRatio(2000, 1000, 2000)).toBe(0.5);
    expect(getProgressRatio(4000, 1000, 2000)).toBe(1);
  });

  it("shows no-candidate decision only for preferred mode", () => {
    expect(
      shouldShowNoCandidatesDecision({
        hasPreferredGender: true,
        hasCandidatesForPreferred: false,
        filterMode: "preferred_only",
      })
    ).toBe(true);
    expect(
      shouldShowNoCandidatesDecision({
        hasPreferredGender: true,
        hasCandidatesForPreferred: false,
        filterMode: "all_genders",
      })
    ).toBe(false);
  });

  it("computes clockwise and counter-clockwise head angles", () => {
    expect(getRingHeadAngle(0, "clockwise")).toBe(-90);
    expect(getRingHeadAngle(0.25, "clockwise")).toBe(0);
    expect(getRingHeadAngle(0.5, "clockwise")).toBe(90);
    expect(getRingHeadAngle(1, "clockwise")).toBe(270);

    expect(getRingHeadAngle(0, "counter-clockwise")).toBe(-90);
    expect(getRingHeadAngle(0.25, "counter-clockwise")).toBe(-180);
    expect(getRingHeadAngle(0.5, "counter-clockwise")).toBe(-270);
    expect(getRingHeadAngle(1, "counter-clockwise")).toBe(-450);
  });

  it("clamps ring progress and resolves head positions", () => {
    expect(clampProgressRatio(-1)).toBe(0);
    expect(clampProgressRatio(0.4)).toBe(0.4);
    expect(clampProgressRatio(4)).toBe(1);

    const topPoint = getRingPoint(100, -90);
    const rightPoint = getRingPoint(100, 0);

    expect(topPoint.x).toBeCloseTo(120);
    expect(topPoint.y).toBeCloseTo(20);
    expect(rightPoint.x).toBeCloseTo(220);
    expect(rightPoint.y).toBeCloseTo(120);
  });

  it("describes partial arcs and suppresses hidden/full arcs", () => {
    expect(describeRingArc({ radius: 100, progress: 0, direction: "clockwise" })).toBeNull();
    expect(describeRingArc({ radius: 100, progress: 1, direction: "clockwise" })).toBeNull();

    const clockwiseArc = describeRingArc({ radius: 100, progress: 0.25, direction: "clockwise" });
    const counterArc = describeRingArc({ radius: 100, progress: 0.25, direction: "counter-clockwise" });

    expect(clockwiseArc).toContain("A 100 100 0 0 1");
    expect(counterArc).toContain("A 100 100 0 0 0");
  });
});

