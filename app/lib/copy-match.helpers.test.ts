import { describe, expect, it } from "vitest";
import { getProgressRatio, shouldShowNoCandidatesDecision } from "./copy-match.helpers";

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
});

