export type VoiceFunctionTileKey = "ranking" | "family" | "shop" | "reward";
export type VoiceCategoryTabKey = "following" | "for_you" | "hot" | "new" | "emotion";

export interface VoicePromoCard {
  id: string;
  title: string;
  subtitle: string;
  accent: "mint" | "gold" | "blue";
}

export interface VoiceFunctionTile {
  id: string;
  label: string;
  icon: VoiceFunctionTileKey;
  badge?: string;
}

export interface VoiceCategoryTab {
  id: VoiceCategoryTabKey;
  label: string;
}

export interface VoiceRoomCard {
  id: string;
  name: string;
  countryFlag: string;
  topic: string;
  memberCount: number;
  accentSeed: number;
  isNew?: boolean;
  hostLabel: string;
  roomMood: string;
  roomType: "Open mic" | "Sleepcall" | "Recruiting" | "Games";
  chips: Array<{
    label: string;
    tone: "mint" | "violet" | "amber" | "neutral";
  }>;
}

export const voiceCenterPromos: VoicePromoCard[] = [
  {
    id: "p1",
    title: "Garden Party",
    subtitle: "Mint rooms • chill games • soft voices",
    accent: "mint",
  },
  {
    id: "p2",
    title: "Lucky Egg",
    subtitle: "Function Center event • rewards tonight",
    accent: "gold",
  },
  {
    id: "p3",
    title: "Wave Match",
    subtitle: "Fast voice pairing • playful prompts",
    accent: "blue",
  },
];

export const voiceCenterFunctionTiles: VoiceFunctionTile[] = [
  { id: "ranking", label: "Ranking", icon: "ranking" },
  { id: "family", label: "Family", icon: "family" },
  { id: "shop", label: "Shop", icon: "shop" },
  { id: "reward", label: "Reward", icon: "reward", badge: "New" },
];

export const voiceCenterCategoryTabs: VoiceCategoryTab[] = [
  { id: "following", label: "Following" },
  { id: "for_you", label: "For You" },
  { id: "hot", label: "Hot" },
  { id: "new", label: "New" },
  { id: "emotion", label: "Emotion" },
];

export const voiceCenterRooms: VoiceRoomCard[] = [
  {
    id: "room1",
    name: "HOUSE OF ACES",
    countryFlag: "PH",
    topic: "Hanap Kaibigan",
    memberCount: 4,
    accentSeed: 1,
    hostLabel: "Recruiting",
    roomMood: "Warm + active",
    roomType: "Recruiting",
    chips: [
      { label: "For You", tone: "violet" },
      { label: "Tagalog", tone: "mint" },
      { label: "18+", tone: "neutral" },
    ],
  },
  {
    id: "room2",
    name: "yap | ig",
    countryFlag: "PH",
    topic: "Late night chika",
    memberCount: 7,
    accentSeed: 2,
    isNew: true,
    hostLabel: "New",
    roomMood: "Soft voices",
    roomType: "Open mic",
    chips: [
      { label: "New", tone: "mint" },
      { label: "Late night", tone: "amber" },
      { label: "Random", tone: "neutral" },
    ],
  },
  {
    id: "room3",
    name: "instaholics / lf sleepcall",
    countryFlag: "PH",
    topic: "For You • soft voices only",
    memberCount: 7,
    accentSeed: 3,
    hostLabel: "Sleepcall",
    roomMood: "Low energy",
    roomType: "Sleepcall",
    chips: [
      { label: "Sleepcall", tone: "violet" },
      { label: "PH", tone: "neutral" },
      { label: "Quiet", tone: "mint" },
    ],
  },
  {
    id: "room4",
    name: "coffee habang ulan",
    countryFlag: "PH",
    topic: "New friends • no pressure",
    memberCount: 5,
    accentSeed: 4,
    hostLabel: "Cozy",
    roomMood: "Calm + cozy",
    roomType: "Games",
    chips: [
      { label: "Cozy", tone: "amber" },
      { label: "Icebreakers", tone: "violet" },
      { label: "Friendly", tone: "mint" },
    ],
  },
];

export const voiceCenterMiniModeTabs = [
  { id: "mine", label: "Mine" },
  { id: "random", label: "Random" },
] as const;
