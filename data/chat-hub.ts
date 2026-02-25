export interface ChatHubOnlineCard {
  id: string;
  name: string;
  countryFlag: string;
  level: number;
  signalCount: number;
  accentSeed: number;
}

export interface ChatHubPromo {
  title: string;
  subtitle: string;
  badgeDot: boolean;
}

export interface ChatHubConversation {
  id: string;
  name: string;
  countryFlag: string;
  level: number;
  preview: string;
  timestamp: string;
  unreadCount?: number;
  accentSeed: number;
  isVerified?: boolean;
  badgeLabel?: string;
  badgeTone?: "mint" | "violet" | "neutral";
  muted?: boolean;
  isPinned?: boolean;
}

export const chatHubOnlineCards: ChatHubOnlineCard[] = [
  { id: "o1", name: "B", countryFlag: "PH", level: 25, signalCount: 4, accentSeed: 1 },
  { id: "o2", name: "Chi", countryFlag: "PH", level: 28, signalCount: 14, accentSeed: 2 },
  { id: "o3", name: "Ari", countryFlag: "PH", level: 31, signalCount: 8, accentSeed: 3 },
];

export const chatHubPromo: ChatHubPromo = {
  title: "Free Diamonds",
  subtitle: "Win random diamonds by watching videos",
  badgeDot: true,
};

export const chatHubConversations: ChatHubConversation[] = [
  {
    id: "c1",
    name: "Deactiv...",
    countryFlag: "PH",
    level: 26,
    preview: "Sige. Ingats...",
    timestamp: "2025/11/20",
    accentSeed: 4,
    badgeLabel: "SOULMATE",
    badgeTone: "violet",
    muted: true,
    isPinned: true,
  },
  {
    id: "c2",
    name: "Lit official",
    countryFlag: "PH",
    level: 0,
    preview: "Visitor Reminder: yan baronia",
    timestamp: "18:51",
    unreadCount: 4,
    accentSeed: 5,
    isVerified: true,
    badgeLabel: "Official",
    badgeTone: "mint",
  },
  {
    id: "c3",
    name: "-----",
    countryFlag: "PH",
    level: 24,
    preview: "ah k",
    timestamp: "12:52",
    unreadCount: 1,
    accentSeed: 6,
    badgeLabel: "Following",
    badgeTone: "neutral",
  },
  {
    id: "c4",
    name: "meow",
    countryFlag: "PH",
    level: 28,
    preview: "ah ok",
    timestamp: "Yesterday 09:06",
    unreadCount: 1,
    accentSeed: 3,
    badgeLabel: "Following",
    badgeTone: "neutral",
  },
  {
    id: "c5",
    name: "Gel",
    countryFlag: "PH",
    level: 29,
    preview: "Say hello to Gel",
    timestamp: "Yesterday",
    accentSeed: 2,
    badgeLabel: "New friend",
    badgeTone: "mint",
  },
];

export const chatHubConnectedSummary = {
  label: "Connected",
  count: 1,
};

