export interface HomeFeatureCard {
  id: string;
  title: string;
  subtitle: string;
  icon: "soul" | "voice" | "party";
  statLabel: string;
}

export interface HomeQuickBanner {
  title: string;
  subtitle: string;
  chip: string;
}

export interface HomeCommunityUser {
  id: string;
  name: string;
  age: number;
  country: string;
  status: string;
  area: string;
  iconSeed: number;
}

export const homeFeatureCards: HomeFeatureCard[] = [
  {
    id: "soul-room",
    title: "Soul game",
    subtitle: "Private vibe rooms",
    icon: "soul",
    statLabel: "74207 Online",
  },
  {
    id: "voice-room",
    title: "Voice game",
    subtitle: "Quick voice matching",
    icon: "voice",
    statLabel: "71069 Online",
  },
  {
    id: "party-match",
    title: "Party match",
    subtitle: "Group energy mode",
    icon: "party",
    statLabel: "29682 Playing",
  },
];

export const homeQuickBanner: HomeQuickBanner = {
  title: "Worldwide Match",
  subtitle: "Meet worldwide friends online",
  chip: "Global",
};

export const homeCommunityUsers: HomeCommunityUser[] = [
  {
    id: "u1",
    name: "stephanie",
    age: 27,
    country: "PH",
    status: "I'm single mom",
    area: "Davao City",
    iconSeed: 1,
  },
  {
    id: "u2",
    name: "mikaaaaaa",
    age: 25,
    country: "PH",
    status: "BATANGENA • chat me",
    area: "Lipa City",
    iconSeed: 2,
  },
  {
    id: "u3",
    name: "tin",
    age: 25,
    country: "PH",
    status: "single mom w/ 2 kids",
    area: "Metro Manila",
    iconSeed: 3,
  },
  {
    id: "u4",
    name: "mariaaa",
    age: 26,
    country: "PH",
    status: "Chubby • serious relationship",
    area: "Cebu",
    iconSeed: 4,
  },
  {
    id: "u5",
    name: "JM",
    age: 24,
    country: "PH",
    status: "naic cavite",
    area: "Cavite",
    iconSeed: 5,
  },
  {
    id: "u6",
    name: "Hanabi",
    age: 24,
    country: "PH",
    status: "coffee + late night chats",
    area: "Pasig",
    iconSeed: 6,
  },
];

