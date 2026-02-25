import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export type SoulAvatarVariant =
  | "soulAvatar01"
  | "soulAvatar02"
  | "soulAvatar03"
  | "soulAvatar04"
  | "soulAvatar05"
  | "soulAvatar06"
  | "soulAvatar07"
  | "soulAvatar08"
  | "soulAvatar09"
  | "soulAvatar10";

interface SoulAvatarPalette {
  base: string;
  alt: string;
  detail: string;
  glow: string;
}

interface SoulAvatarFeatures {
  headShape: "round" | "squircle" | "teardrop";
  topFeature: "none" | "horns" | "antenna" | "crown" | "leaf";
  eyeShape: "dot" | "oval" | "wink" | "sleepy";
  mouthShape: "smile" | "flat" | "o" | "fang";
  sideDetail: "none" | "cheeks" | "stars" | "blush" | "rings";
}

const PALETTES: SoulAvatarPalette[] = [
  { base: "#2DD4BF", alt: "#14B8A6", detail: "#D6FFFA", glow: "rgba(45,212,191,0.24)" },
  { base: "#8EA3FF", alt: "#60A5FA", detail: "#EEF2FF", glow: "rgba(142,163,255,0.24)" },
  { base: "#F472B6", alt: "#FB7185", detail: "#FFF1F7", glow: "rgba(244,114,182,0.24)" },
  { base: "#A78BFA", alt: "#8B5CF6", detail: "#F3E8FF", glow: "rgba(167,139,250,0.24)" },
  { base: "#34D399", alt: "#22C55E", detail: "#ECFDF5", glow: "rgba(52,211,153,0.24)" },
  { base: "#F59E0B", alt: "#FB7185", detail: "#FFF7ED", glow: "rgba(245,158,11,0.22)" },
  { base: "#38BDF8", alt: "#818CF8", detail: "#E0F2FE", glow: "rgba(56,189,248,0.22)" },
  { base: "#FB7185", alt: "#EC4899", detail: "#FFF1F2", glow: "rgba(251,113,133,0.24)" },
  { base: "#4ADE80", alt: "#2DD4BF", detail: "#F0FDF4", glow: "rgba(74,222,128,0.22)" },
  { base: "#C084FC", alt: "#60A5FA", detail: "#FAF5FF", glow: "rgba(192,132,252,0.24)" },
];

const FEATURES: SoulAvatarFeatures[] = [
  { headShape: "round", topFeature: "antenna", eyeShape: "dot", mouthShape: "smile", sideDetail: "cheeks" },
  { headShape: "squircle", topFeature: "horns", eyeShape: "oval", mouthShape: "flat", sideDetail: "rings" },
  { headShape: "teardrop", topFeature: "none", eyeShape: "wink", mouthShape: "o", sideDetail: "stars" },
  { headShape: "round", topFeature: "crown", eyeShape: "dot", mouthShape: "fang", sideDetail: "blush" },
  { headShape: "squircle", topFeature: "leaf", eyeShape: "sleepy", mouthShape: "smile", sideDetail: "none" },
  { headShape: "teardrop", topFeature: "horns", eyeShape: "oval", mouthShape: "flat", sideDetail: "cheeks" },
  { headShape: "round", topFeature: "leaf", eyeShape: "wink", mouthShape: "smile", sideDetail: "rings" },
  { headShape: "squircle", topFeature: "antenna", eyeShape: "dot", mouthShape: "o", sideDetail: "stars" },
  { headShape: "teardrop", topFeature: "crown", eyeShape: "sleepy", mouthShape: "fang", sideDetail: "blush" },
  { headShape: "round", topFeature: "none", eyeShape: "oval", mouthShape: "smile", sideDetail: "rings" },
];

function SoulAvatarBase({
  className,
  palette,
  variantIndex,
  features,
  ...props
}: IconProps & { palette: SoulAvatarPalette; variantIndex: number; features: SoulAvatarFeatures }) {
  const id = `soulAvatarGrad-${variantIndex}`;
  const eyeY = features.headShape === "teardrop" ? 19.5 : 20.8;
  const mouthY = features.mouthShape === "flat" ? 32.2 : 31.6;
  const headPath =
    features.headShape === "squircle"
      ? "M12 6H36C40.418 6 44 9.582 44 14V34C44 38.418 40.418 42 36 42H12C7.582 42 4 38.418 4 34V14C4 9.582 7.582 6 12 6Z"
      : features.headShape === "teardrop"
        ? "M24 4C34.8 4 43 12.8 43 23.4C43 35.2 34.7 44 24 44C13.3 44 5 35.2 5 23.4C5 12.8 13.2 4 24 4Z"
        : "M24 4C35.046 4 44 12.954 44 24C44 35.046 35.046 44 24 44C12.954 44 4 35.046 4 24C4 12.954 12.954 4 24 4Z";

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id={id} x1="8" y1="7" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette.base} />
          <stop offset="1" stopColor={palette.alt} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={palette.glow} />
      <path d={headPath} fill={`url(#${id})`} />
      {features.topFeature === "horns" ? (
        <>
          <path d="M15 12L19 8L20 14" fill={palette.detail} fillOpacity="0.9" />
          <path d="M33 12L29 8L28 14" fill={palette.detail} fillOpacity="0.9" />
        </>
      ) : null}
      {features.topFeature === "antenna" ? (
        <>
          <path d="M24 8V13" stroke={palette.detail} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="6.6" r="1.6" fill={palette.detail} />
        </>
      ) : null}
      {features.topFeature === "crown" ? (
        <path d="M14 13L19 10L24 14L29 10L34 13L32.8 17H15.2L14 13Z" fill={palette.detail} fillOpacity="0.88" />
      ) : null}
      {features.topFeature === "leaf" ? (
        <>
          <path d="M24 9C26.8 9.6 28.7 11.5 29.3 14.3C26.5 13.7 24.6 11.8 24 9Z" fill={palette.detail} fillOpacity="0.9" />
          <path d="M24 9V14" stroke={palette.detail} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      <ellipse cx="24" cy="27" rx="12.8" ry="11.4" fill="rgba(255,255,255,0.08)" />
      {features.eyeShape === "dot" ? (
        <>
          <circle cx="17.2" cy={eyeY} r="2.1" fill={palette.detail} />
          <circle cx="30.8" cy={eyeY} r="2.1" fill={palette.detail} />
        </>
      ) : null}
      {features.eyeShape === "oval" ? (
        <>
          <ellipse cx="17.2" cy={eyeY} rx="2.5" ry="1.8" fill={palette.detail} />
          <ellipse cx="30.8" cy={eyeY} rx="2.5" ry="1.8" fill={palette.detail} />
        </>
      ) : null}
      {features.eyeShape === "wink" ? (
        <>
          <path d={`M14.9 ${eyeY}C15.8 ${eyeY - 0.9} 17.4 ${eyeY - 0.9} 18.4 ${eyeY}`} stroke={palette.detail} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="30.8" cy={eyeY} r="2.1" fill={palette.detail} />
        </>
      ) : null}
      {features.eyeShape === "sleepy" ? (
        <>
          <path d={`M14.8 ${eyeY}H19.4`} stroke={palette.detail} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M28.6 ${eyeY}H33.2`} stroke={palette.detail} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {features.sideDetail === "cheeks" ? (
        <>
          <circle cx="13.5" cy="26.5" r="2.2" fill="rgba(255,255,255,0.18)" />
          <circle cx="34.5" cy="26.5" r="2.2" fill="rgba(255,255,255,0.18)" />
        </>
      ) : null}
      {features.sideDetail === "stars" ? (
        <>
          <path d="M12.4 25.2L13.3 23.5L14.2 25.2L16 26L14.2 26.8L13.3 28.6L12.4 26.8L10.6 26L12.4 25.2Z" fill="rgba(255,255,255,0.25)" />
          <path d="M33.8 26.1L34.4 24.9L35 26.1L36.2 26.7L35 27.3L34.4 28.5L33.8 27.3L32.6 26.7L33.8 26.1Z" fill="rgba(255,255,255,0.22)" />
        </>
      ) : null}
      {features.sideDetail === "blush" ? (
        <>
          <ellipse cx="14.4" cy="26.8" rx="2.5" ry="1.4" fill="rgba(255,255,255,0.14)" />
          <ellipse cx="33.6" cy="26.8" rx="2.5" ry="1.4" fill="rgba(255,255,255,0.14)" />
        </>
      ) : null}
      {features.sideDetail === "rings" ? (
        <>
          <circle cx="11.8" cy="26.5" r="2.2" stroke="rgba(255,255,255,0.20)" />
          <circle cx="36.2" cy="26.5" r="2.2" stroke="rgba(255,255,255,0.20)" />
        </>
      ) : null}
      {features.mouthShape === "smile" ? (
        <path d={`M17 ${mouthY}C19.8 ${mouthY + 3} 28.2 ${mouthY + 3} 31 ${mouthY}`} stroke={palette.detail} strokeWidth="2.2" strokeLinecap="round" />
      ) : null}
      {features.mouthShape === "flat" ? (
        <path d={`M18 ${mouthY}H30`} stroke={palette.detail} strokeWidth="2.2" strokeLinecap="round" />
      ) : null}
      {features.mouthShape === "o" ? (
        <circle cx="24" cy={mouthY + 1} r="2.2" stroke={palette.detail} strokeWidth="2" />
      ) : null}
      {features.mouthShape === "fang" ? (
        <>
          <path d={`M18 ${mouthY}C20.2 ${mouthY + 2.6} 27.8 ${mouthY + 2.6} 30 ${mouthY}`} stroke={palette.detail} strokeWidth="2.1" strokeLinecap="round" />
          <path d={`M22.8 ${mouthY + 1.6}L23.7 ${mouthY + 4.1}L24.6 ${mouthY + 1.6}`} fill={palette.detail} />
          <path d={`M26.6 ${mouthY + 1.6}L27.4 ${mouthY + 3.8}L28.2 ${mouthY + 1.6}`} fill={palette.detail} />
        </>
      ) : null}
      <path
        d={`M12 ${14 + (variantIndex % 5)}C16 ${11 + (variantIndex % 4)} 19 ${11 + (variantIndex % 4)} 22 ${14 + (variantIndex % 5)}`}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="37.5" cy="36.5" r="3.6" fill={palette.detail} fillOpacity="0.16" />
    </svg>
  );
}

function makeSoulAvatarComponent(variantIndex: number) {
  const palette = PALETTES[(variantIndex - 1) % PALETTES.length];
  const features = FEATURES[(variantIndex - 1) % FEATURES.length];
  return function SoulAvatarComponent(props: IconProps) {
    return <SoulAvatarBase {...props} palette={palette} features={features} variantIndex={variantIndex} />;
  };
}

export const SoulAvatar01 = makeSoulAvatarComponent(1);
export const SoulAvatar02 = makeSoulAvatarComponent(2);
export const SoulAvatar03 = makeSoulAvatarComponent(3);
export const SoulAvatar04 = makeSoulAvatarComponent(4);
export const SoulAvatar05 = makeSoulAvatarComponent(5);
export const SoulAvatar06 = makeSoulAvatarComponent(6);
export const SoulAvatar07 = makeSoulAvatarComponent(7);
export const SoulAvatar08 = makeSoulAvatarComponent(8);
export const SoulAvatar09 = makeSoulAvatarComponent(9);
export const SoulAvatar10 = makeSoulAvatarComponent(10);

const avatarMap: Record<SoulAvatarVariant, (props: IconProps) => ReactElement> = {
  soulAvatar01: SoulAvatar01,
  soulAvatar02: SoulAvatar02,
  soulAvatar03: SoulAvatar03,
  soulAvatar04: SoulAvatar04,
  soulAvatar05: SoulAvatar05,
  soulAvatar06: SoulAvatar06,
  soulAvatar07: SoulAvatar07,
  soulAvatar08: SoulAvatar08,
  soulAvatar09: SoulAvatar09,
  soulAvatar10: SoulAvatar10,
};

export function SoulAvatarIcon({
  variant = "soulAvatar01",
  className,
  ...props
}: IconProps & { variant?: SoulAvatarVariant }) {
  const Component = avatarMap[variant];
  return <Component className={className} {...props} />;
}

export function getSoulAvatarVariantByIndex(index: number): SoulAvatarVariant {
  const normalized = Math.abs(index % 10) + 1;
  return `soulAvatar${String(normalized).padStart(2, "0")}` as SoulAvatarVariant;
}

export function resolveSoulAvatarVariant(iconKey: string | undefined | null, fallbackIndex = 0): SoulAvatarVariant {
  if (
    iconKey &&
    [
      "soulAvatar01",
      "soulAvatar02",
      "soulAvatar03",
      "soulAvatar04",
      "soulAvatar05",
      "soulAvatar06",
      "soulAvatar07",
      "soulAvatar08",
      "soulAvatar09",
      "soulAvatar10",
    ].includes(iconKey)
  ) {
    return iconKey as SoulAvatarVariant;
  }
  return getSoulAvatarVariantByIndex(fallbackIndex);
}
