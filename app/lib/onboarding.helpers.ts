import { type GenderOption, signupOnboardingSlides } from "../../data";
import { sanitizeUsernameInput, USERNAME_MIN_LENGTH } from "./username";

export function getOnboardingTotalSteps(): number {
  return signupOnboardingSlides.length + 2;
}

export function getUsernameStepIndex(): number {
  return signupOnboardingSlides.length;
}

export function getGenderStepIndex(): number {
  return signupOnboardingSlides.length + 1;
}

export function canContinueFromUsername(username: string): boolean {
  return sanitizeUsernameInput(username).length >= USERNAME_MIN_LENGTH;
}

export function canFinishOnboarding(
  selectedGender: GenderOption | null | undefined
): selectedGender is GenderOption {
  return Boolean(selectedGender);
}

export function buildOnboardingUpsertArgs(
  deviceId: string,
  username: string,
  gender: GenderOption
): { deviceId: string; username: string; gender: GenderOption } {
  return {
    deviceId,
    username: sanitizeUsernameInput(username),
    gender,
  };
}
