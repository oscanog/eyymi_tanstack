import { describe, expect, it } from "vitest";
import {
  COPY_MATCH_HOLD_MS,
  getCopyCarouselVisualState,
  getHoldProgress,
  getSignedCircularDistance,
  getWrappedIndex,
} from "./copy-carousel";

describe("copy carousel helpers", () => {
  it("wraps carousel index correctly", () => {
    expect(getWrappedIndex(9, 1, 10)).toBe(0);
    expect(getWrappedIndex(0, -1, 10)).toBe(9);
    expect(getWrappedIndex(3, 2, 10)).toBe(5);
  });

  it("computes signed circular distance with wraparound", () => {
    expect(getSignedCircularDistance(0, 9, 10)).toBe(1);
    expect(getSignedCircularDistance(9, 0, 10)).toBe(-1);
    expect(getSignedCircularDistance(3, 0, 10)).toBe(3);
    expect(getSignedCircularDistance(0, 3, 10)).toBe(-3);
  });

  it("returns bounded visual states", () => {
    const center = getCopyCarouselVisualState(4, 4, 10);
    const side = getCopyCarouselVisualState(5, 4, 10);
    const far = getCopyCarouselVisualState(6, 4, 10);
    const hidden = getCopyCarouselVisualState(8, 4, 10);

    expect(center.isCenter).toBe(true);
    expect(center.isVisible).toBe(true);
    expect(center.scale).toBeGreaterThan(side.scale);

    expect(side.isVisible).toBe(true);
    expect(far.isVisible).toBe(true);
    expect(hidden.isVisible).toBe(false);
    expect(hidden.opacity).toBe(0);
  });

  it("clamps hold progress into [0,1]", () => {
    expect(getHoldProgress(1000, 1000, COPY_MATCH_HOLD_MS)).toBe(0);
    expect(getHoldProgress(1100, 1000, COPY_MATCH_HOLD_MS)).toBe(0.05);
    expect(getHoldProgress(3500, 1000, COPY_MATCH_HOLD_MS)).toBe(1);
    expect(getHoldProgress(900, 1000, COPY_MATCH_HOLD_MS)).toBe(0);
  });
});
