import { soulGameInlineStatusCopy, type SoulGameUiStateKey } from "../../../data";

export type SoulGameQueueStatus = "inactive" | "queued" | "matching" | "matched";
export type SoulGameMatchStatus =
  | "pending_intro"
  | "active_2min"
  | "ended"
  | "cancelled";
export type SoulGamePressEventStatus = "pending" | "matched" | "expired";

export interface SoulGameQueuePresence {
  queueEntryId: string;
  authUserId?: string;
  profileUserId?: string;
  username?: string;
  avatarId?: string;
  isActive: boolean;
  joinedAt: number;
  lastHeartbeatAt: number;
}

export interface SoulGameQueueSnapshot {
  self: SoulGameQueuePresence | null;
  onlineCandidates: Array<{
    queueEntryId: string;
    username?: string;
    avatarId?: string;
    joinedAt: number;
    lastHeartbeatAt: number;
  }>;
  queueCount: number;
  estimatedWaitMs?: number;
  status: SoulGameQueueStatus;
  serverNow: number;
}

export interface SoulGamePressInterval {
  pressEventId: string;
  queueEntryId: string;
  pressStartedAt: number;
  pressEndedAt?: number;
  durationMs?: number;
  status: SoulGamePressEventStatus;
}

export interface SoulGameMatchSession {
  sessionId: string;
  matchId: string;
  status: SoulGameMatchStatus;
  matchedUser: {
    username?: string;
    avatarId?: string;
  };
  createdAt: number;
  conversationEndsAt: number;
}

export interface SoulGameMatchSnapshot {
  matchId: string;
  userAQueueEntryId: string;
  userBQueueEntryId: string;
  matchWindowStart: number;
  matchWindowEnd: number;
  overlapMs: number;
  status: SoulGameMatchStatus;
  conversationEndsAt?: number;
  createdAt: number;
}

export interface SoulGameViewModel {
  uiState: SoulGameUiStateKey;
  isPressing: boolean;
  queueSnapshot: SoulGameQueueSnapshot | null;
  activePress: SoulGamePressInterval | null;
  matchSnapshot: SoulGameMatchSnapshot | null;
  session: SoulGameMatchSession | null;
  inlineMessage: {
    title: string;
    description: string;
    tone: "default" | "success" | "error";
  };
}

export interface SoulGameJoinQueueArgs {
  authUserId?: string;
  profileUserId?: string;
  username?: string;
  avatarId?: string;
}

export interface SoulGameHeartbeatArgs {
  queueEntryId: string;
}

export interface SoulGameLeaveQueueArgs {
  queueEntryId: string;
}

export interface SoulGamePressStartArgs {
  queueEntryId: string;
}

export interface SoulGamePressEndArgs {
  queueEntryId: string;
  pressEventId: string;
}

export type SoulGameSafeErrorCode =
  | "QUEUE_JOIN_FAILED"
  | "QUEUE_HEARTBEAT_FAILED"
  | "PRESS_START_FAILED"
  | "PRESS_END_FAILED"
  | "MATCH_SYNC_FAILED"
  | "SESSION_START_FAILED"
  | "UNKNOWN";

const soulGameSafeErrorMessages: Record<SoulGameSafeErrorCode, string> = {
  QUEUE_JOIN_FAILED: "We could not join the Soul Game queue. Please try again.",
  QUEUE_HEARTBEAT_FAILED: "Connection looks unstable. We are trying to keep your queue status active.",
  PRESS_START_FAILED: "Your press did not start correctly. Press and hold again.",
  PRESS_END_FAILED: "Your press could not be submitted. Please try another hold.",
  MATCH_SYNC_FAILED: "We could not sync your match status yet. Please wait a moment and retry.",
  SESSION_START_FAILED: "Your match was found, but the session could not start. Please rejoin the queue.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function getSoulGameInlineMessageForState(
  uiState: SoulGameUiStateKey,
  toneOverride?: "default" | "success" | "error",
): SoulGameViewModel["inlineMessage"] {
  const base = soulGameInlineStatusCopy[uiState];
  const tone =
    toneOverride ?? (uiState === "matched" || uiState === "session"
      ? "success"
      : uiState === "error"
        ? "error"
        : "default");

  return {
    title: base.title,
    description: base.description,
    tone,
  };
}

export function mapSoulGameErrorToInlineMessage(errorCode: SoulGameSafeErrorCode) {
  return {
    title: "Soul Game issue",
    description: soulGameSafeErrorMessages[errorCode],
    tone: "error" as const,
  };
}
