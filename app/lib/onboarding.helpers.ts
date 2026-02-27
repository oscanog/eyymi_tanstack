import { copyCarouselAvatars, type GenderOption, signupOnboardingSlides } from "../../data";
import { sanitizeUsernameInput, USERNAME_MIN_LENGTH } from "./username";

export const onboardingGenderCopy = {
  title: "Select your gender",
  subtitle: "This is your gender on your profile.",
  helperText:
    "Choose the gender that describes you. This is saved to your profile and can be changed later.",
  validationError: "Please select your gender before finishing setup.",
  groupLabel: "Your gender selection",
  legend: "Your gender selection",
} as const;

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
  gender: GenderOption,
  avatarId: string
): { deviceId: string; username: string; gender: GenderOption; avatarId: string } {
  return {
    deviceId,
    username: sanitizeUsernameInput(username),
    gender,
    avatarId,
  };
}

export function pickRandomCopyAvatarId(randomFn: () => number = Math.random): string {
  if (copyCarouselAvatars.length === 0) {
    return "copy-ava-01";
  }

  const raw = randomFn();
  const normalized = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.999999) : 0;
  const index = Math.floor(normalized * copyCarouselAvatars.length);
  return copyCarouselAvatars[index]?.id ?? copyCarouselAvatars[0].id;
}
