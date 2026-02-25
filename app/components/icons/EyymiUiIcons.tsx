import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

export function RoutePulseIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="routePulseMint" x1="10" y1="8" x2="55" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="20" r="6" fill="url(#routePulseMint)" />
      <circle cx="46" cy="42" r="6" fill="url(#routePulseMint)" />
      <path d="M22 22C28 26 31 28 36 32C40 35 42 37 42 39" stroke="#CFFEF7" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 4" />
      <path d="M20 40C25 32 31 28 42 22" stroke="rgba(20,184,166,0.35)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
    </svg>
  );
}

export function TrustLinkIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="trustLinkMint" x1="12" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="1" stopColor="#8EA3FF" />
        </linearGradient>
      </defs>
      <path d="M22 33C17.582 33 14 29.418 14 25C14 20.582 17.582 17 22 17H29" stroke="url(#trustLinkMint)" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 31C46.418 31 50 34.582 50 39C50 43.418 46.418 47 42 47H35" stroke="url(#trustLinkMint)" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 38L39 24" stroke="#D8FFF9" strokeWidth="4" strokeLinecap="round" />
      <rect x="10" y="10" width="44" height="44" rx="16" stroke="rgba(255,255,255,0.08)" />
    </svg>
  );
}

export function SoulGameIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <rect x="6" y="10" width="52" height="44" rx="14" fill="rgba(20,184,166,0.10)" />
      <path d="M20 24C20 19.582 23.582 16 28 16H36C40.418 16 44 19.582 44 24V37C44 41.418 40.418 45 36 45H26L20 49V24Z" fill="url(#soulBubble)" />
      <circle cx="29" cy="30" r="2" fill="white" />
      <circle cx="36" cy="30" r="2" fill="white" />
      <path d="M28 36C30.5 38.2 34.5 38.2 37 36" stroke="#F6FFFD" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="soulBubble" x1="20" y1="16" x2="45" y2="47" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function VoiceGameIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <rect x="6" y="10" width="52" height="44" rx="14" fill="rgba(142,163,255,0.10)" />
      <path d="M21 39C26 38 31 33 33 27C34 23 39 21 42 24C44 26 44 29 43 32L47 36C48.5 37.5 48.5 40 47 41.5L44.5 44C43 45.5 40.5 45.5 39 44L35 40C31 42 26 42 21 39Z" fill="url(#voiceMint)" />
      <path d="M38 21L44 15" stroke="#DDFBFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 23L50 22" stroke="#DDFBFF" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="voiceMint" x1="21" y1="22" x2="49" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="1" stopColor="#8EA3FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PartyMatchIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <rect x="6" y="10" width="52" height="44" rx="14" fill="rgba(139,92,246,0.10)" />
      <path d="M29 18C37 18 43 24 43 32C43 40 37 46 29 46C27.5 46 26 45.8 24.7 45.3C23.9 45 23 45.1 22.3 45.6L18.5 48.4L19.4 43.8C19.6 42.9 19.3 41.9 18.7 41.1C16.4 38.5 15 35.1 15 31.4C15 24 21 18 29 18Z" fill="url(#partyViolet)" />
      <path d="M36 20L49 15L44 28L49 40L35 36L27 47L25 33L14 26L28 23L36 20Z" fill="rgba(20,184,166,0.78)" />
      <defs>
        <linearGradient id="partyViolet" x1="15" y1="18" x2="43" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PlanetOrbitIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id="planetMint" x1="20" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D5FFF8" />
          <stop offset="1" stopColor="#8EA3FF" />
        </linearGradient>
      </defs>
      <circle cx="31" cy="33" r="10" fill="url(#planetMint)" />
      <ellipse cx="32" cy="32" rx="24" ry="9" stroke="rgba(20,184,166,0.55)" strokeWidth="2.2" transform="rotate(-14 32 32)" />
      <ellipse cx="32" cy="32" rx="26" ry="10" stroke="rgba(142,163,255,0.35)" strokeWidth="1.5" transform="rotate(-14 32 32)" />
      <circle cx="49" cy="25" r="3" fill="#14B8A6" />
    </svg>
  );
}

export function FilterSlidersIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2.5" fill="currentColor" />
      <circle cx="15" cy="17" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function CommunityAvatarIcon({
  seed = 1,
  className,
  ...props
}: IconProps & { seed?: number }) {
  const palettes = [
    ["#8EA3FF", "#14B8A6"],
    ["#F472B6", "#A78BFA"],
    ["#2DD4BF", "#8EA3FF"],
    ["#C084FC", "#14B8A6"],
    ["#60A5FA", "#A78BFA"],
    ["#34D399", "#818CF8"],
  ];
  const [a, b] = palettes[(seed - 1) % palettes.length];

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} {...props}>
      <defs>
        <linearGradient id={`avatarGrad-${seed}`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#avatarGrad-${seed})`} />
      <circle cx="17" cy="20" r="2.2" fill="#fff" fillOpacity="0.95" />
      <circle cx="31" cy="20" r="2.2" fill="#fff" fillOpacity="0.95" />
      <path d="M15.5 30C18.5 33.5 29.5 33.5 32.5 30" stroke="#fff" strokeOpacity="0.95" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M10 11C14 8 18 7 22 10" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <circle cx="39" cy="38.5" r="4" fill="#67E8F9" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function BottomHomeIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M4 11L12 4L20 11V20H14V14H10V20H4V11Z" fill="currentColor" />
    </svg>
  );
}

export function BottomMicIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 11C6 14.314 8.686 17 12 17C15.314 17 18 14.314 18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BottomOrbitIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.8" transform="rotate(-18 12 12)" />
    </svg>
  );
}

export function BottomChatIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M5 6H19V16H10L6 19V16H5V6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomProfileIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20C6.6 16.7 9 15 12 15C15 15 17.4 16.7 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

