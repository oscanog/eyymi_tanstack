export type SoulGameUiStateKey =
  | "idle"
  | "queueing"
  | "pressing"
  | "matched"
  | "error";

export interface SoulGameTimingConfig {
  minHoldMs: number;
  maxPressDurationMs: number;
  queueHeartbeatMs: number;
  queueStaleAfterMs: number;
  queuePollMs: number;
  matchPollMs: number;
  candidateRotateMs: number;
  successIntroMs: number;
}

export interface SoulGameInlineStatusCopy {
  title: string;
  description: string;
}

export const soulGameTimingConfig: SoulGameTimingConfig = {
  minHoldMs: 1500,
  maxPressDurationMs: 6000,
  queueHeartbeatMs: 15000,
  queueStaleAfterMs: 45000,
  queuePollMs: 2500,
  matchPollMs: 1000,
  candidateRotateMs: 3000,
  successIntroMs: 0,
};

export const soulGameUiStateOrder: SoulGameUiStateKey[] = [
  "idle",
  "queueing",
  "pressing",
  "matched",
  "error",
];

export const soulGameInlineStatusCopy: Record<SoulGameUiStateKey, SoulGameInlineStatusCopy> = {
  idle: {
    title: "Ready to match",
    description: "Hold 1.5s while this avatar is in center.",
  },
  queueing: {
    title: "Looking for someone",
    description: "You are in the Soul Game queue. Every center avatar gets one 3-second chance.",
  },
  pressing: {
    title: "Hold steady",
    description: "Your ring fills clockwise. If they press you back, their ring appears counter-clockwise.",
  },
  matched: {
    title: "Match found",
    description: "eyymi match happened.",
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
