import { describe, expect, it } from "vitest";
import {
  buildOnboardingUpsertArgs,
  canContinueFromUsername,
  canFinishOnboarding,
  getGenderStepIndex,
  getOnboardingTotalSteps,
  getUsernameStepIndex,
  onboardingGenderCopy,
  pickRandomCopyAvatarId,
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

  it("builds users:upsert payload with username, gender, and avatar", () => {
    expect(buildOnboardingUpsertArgs("device-1", "  melvin  ", "lesbian", "copy-ava-07")).toEqual({
      deviceId: "device-1",
      username: "melvin",
      gender: "lesbian",
      avatarId: "copy-ava-07",
    });
  });

  it("picks random avatar id from copy carousel list", () => {
    expect(pickRandomCopyAvatarId(() => 0)).toBe("copy-ava-01");
    expect(pickRandomCopyAvatarId(() => 0.999999)).toBe("copy-ava-10");
    expect(pickRandomCopyAvatarId(() => Number.NaN)).toBe("copy-ava-01");
  });

  it("keeps step 4 copy explicit about signed-up user gender", () => {
    expect(onboardingGenderCopy.title).toBe("Select your gender");
    expect(onboardingGenderCopy.subtitle).toBe("This is your gender on your profile.");
    expect(onboardingGenderCopy.helperText).toContain("saved to your profile");
    expect(onboardingGenderCopy.validationError).toBe(
      "Please select your gender before finishing setup."
    );
    expect(onboardingGenderCopy.groupLabel).toBe("Your gender selection");
  });
});
