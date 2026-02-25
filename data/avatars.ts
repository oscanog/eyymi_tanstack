import type { SoulAvatarVariant } from "../app/components/icons";

export interface SoulGameAvatarMeta {
  id: string;
  iconKey: SoulAvatarVariant;
  label: string;
  accentToken:
    | "--color-rose"
    | "--color-text-primary"
    | "--color-text-secondary"
    | "--color-navy-elevated";
  moodTag: "warm" | "playful" | "cosmic" | "calm" | "bold";
}

export interface OnboardingAvatarMeta {
  id: string;
  iconKey: string;
  label: string;
  paletteSeed: number;
}

export const soulGameAvatarCatalog: SoulGameAvatarMeta[] = [
  { id: "soul-ava-01", iconKey: "soulAvatar01", label: "Mint Orbit", accentToken: "--color-rose", moodTag: "warm" },
  { id: "soul-ava-02", iconKey: "soulAvatar02", label: "Cloud Blink", accentToken: "--color-text-secondary", moodTag: "calm" },
  { id: "soul-ava-03", iconKey: "soulAvatar03", label: "Tiny Comet", accentToken: "--color-navy-elevated", moodTag: "cosmic" },
  { id: "soul-ava-04", iconKey: "soulAvatar04", label: "Bubble Horn", accentToken: "--color-rose", moodTag: "playful" },
  { id: "soul-ava-05", iconKey: "soulAvatar05", label: "Echo Fox", accentToken: "--color-text-primary", moodTag: "bold" },
  { id: "soul-ava-06", iconKey: "soulAvatar06", label: "Neon Pebble", accentToken: "--color-text-secondary", moodTag: "playful" },
  { id: "soul-ava-07", iconKey: "soulAvatar07", label: "Drift Bloom", accentToken: "--color-navy-elevated", moodTag: "warm" },
  { id: "soul-ava-08", iconKey: "soulAvatar08", label: "Nova Smile", accentToken: "--color-rose", moodTag: "cosmic" },
  { id: "soul-ava-09", iconKey: "soulAvatar09", label: "Soft Fang", accentToken: "--color-text-primary", moodTag: "bold" },
  { id: "soul-ava-10", iconKey: "soulAvatar10", label: "Loop Pup", accentToken: "--color-text-secondary", moodTag: "calm" },
];

export function getSoulGameAvatarById(id: string | undefined | null): SoulGameAvatarMeta | null {
  if (!id) return null;
  return soulGameAvatarCatalog.find((avatar) => avatar.id === id) ?? null;
}

export function getSoulGameAvatarByIconKey(iconKey: SoulAvatarVariant | undefined | null): SoulGameAvatarMeta | null {
  if (!iconKey) return null;
  return soulGameAvatarCatalog.find((avatar) => avatar.iconKey === iconKey) ?? null;
}

export const onboardingAvatarCatalog: OnboardingAvatarMeta[] = Array.from({ length: 20 }, (_, index) => ({
  id: `onboard-ava-${String(index + 1).padStart(2, "0")}`,
  iconKey: `onboardingAvatar${String(index + 1).padStart(2, "0")}`,
  label: `Avatar ${index + 1}`,
  paletteSeed: (index % 6) + 1,
}));

export const soulGameAvatarRotationConfig = {
  rotateEveryMs: 5000,
  skipSelf: true,
  cycleBeforeRepeat: true,
} as const;

export const onboardingAvatarSelectionConfig = {
  defaultRandomized: true,
  avoidImmediateRepeatWindow: 5,
  minTouchTargetPx: 44,
} as const;
