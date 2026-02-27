import { describe, expect, it } from "vitest";
import {
  buildOnboardingUpsertArgs,
  canContinueFromUsername,
  canFinishOnboarding,
  getGenderStepIndex,
  getOnboardingTotalSteps,
  getUsernameStepIndex,
} from "./onboarding.helpers";

describe("onboarding helpers", () => {
  it("keeps onboarding flow with 4 total steps for current slide count", () => {
    expect(getOnboardingTotalSteps()).toBe(4);
    expect(getUsernameStepIndex()).toBe(2);
    expect(getGenderStepIndex()).toBe(3);
  });

  it("allows username progression only when minimum length is satisfied", () => {
    expect(canContinueFromUsername("me")).toBe(false);
    expect(canContinueFromUsername("mel")).toBe(true);
    expect(canContinueFromUsername("  mel  ")).toBe(true);
  });

  it("enables finish only after gender selection", () => {
    expect(canFinishOnboarding(null)).toBe(false);
    expect(canFinishOnboarding(undefined)).toBe(false);
    expect(canFinishOnboarding("male")).toBe(true);
  });

  it("builds users:upsert payload with username and gender", () => {
    expect(buildOnboardingUpsertArgs("device-1", "  melvin  ", "lesbian")).toEqual({
      deviceId: "device-1",
      username: "melvin",
      gender: "lesbian",
    });
  });
});
