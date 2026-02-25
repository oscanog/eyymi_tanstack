export type SoulGameUiStateKey =
  | "idle"
  | "queueing"
  | "pressing"
  | "matched"
  | "session"
  | "error";

export interface SoulGameTimingConfig {
  minHoldMs: number;
  minOverlapMs: number;
  maxPressDurationMs: number;
  queueHeartbeatMs: number;
  queueStaleAfterMs: number;
  queuePollMs: number;
  matchPollMs: number;
  candidateRotateMs: number;
  successIntroMs: number;
  sessionDurationMs: number;
}

export interface SoulGameInlineStatusCopy {
  title: string;
  description: string;
}

export const soulGameTimingConfig: SoulGameTimingConfig = {
  minHoldMs: 600,
  minOverlapMs: 350,
  maxPressDurationMs: 6000,
  queueHeartbeatMs: 15000,
  queueStaleAfterMs: 45000,
  queuePollMs: 2500,
  matchPollMs: 1000,
  candidateRotateMs: 5000,
  successIntroMs: 1000,
  sessionDurationMs: 2 * 60 * 1000,
};

export const soulGameUiStateOrder: SoulGameUiStateKey[] = [
  "idle",
  "queueing",
  "pressing",
  "matched",
  "session",
  "error",
];

export const soulGameInlineStatusCopy: Record<SoulGameUiStateKey, SoulGameInlineStatusCopy> = {
  idle: {
    title: "Ready to match",
    description: "Press and hold when you are ready. We will look for an overlapping press.",
  },
  queueing: {
    title: "Looking for someone",
    description: "You are in the Soul Game queue. Keep this screen open while we search.",
  },
  pressing: {
    title: "Hold steady",
    description: "Keep holding the circle. A match happens when your press overlaps another player.",
  },
  matched: {
    title: "Match found",
    description: "A compatible timing overlap was found. Starting your 2-minute conversation.",
  },
  session: {
    title: "2-minute session live",
    description: "Your Soul Game conversation is active. Stay present and enjoy the moment.",
  },
  error: {
    title: "Could not continue",
    description: "Please try again in a moment. Your queue state may need a fresh reconnect.",
  },
};

export const soulGameActionCopy = {
  joinQueue: "Join queue",
  leaveQueue: "Leave queue",
  pressToMatch: "Press and hold",
  releaseToSubmit: "Release",
  tryAgain: "Try again",
} as const;

