import { soulGameInlineStatusCopy, type SoulGameUiStateKey } from "../../../data";

export type SoulGameQueueStatus = "inactive" | "queued" | "matching" | "matched";
export type SoulGameMatchStatus = "pending_intro" | "ended" | "cancelled";
export type SoulGamePressEventStatus = "holding" | "ready" | "matched" | "expired" | "cancelled";

export interface SoulGameQueuePresence {
  queueEntryId: string;
  authUserId?: string | null;
  profileUserId?: string | null;
  username?: string | null;
  avatarId?: string | null;
  isActive: boolean;
  joinedAt: number;
  lastHeartbeatAt: number;
}

export interface SoulGameQueueSnapshot {
  self: SoulGameQueuePresence | null;
  onlineCandidates: Array<{
    queueEntryId: string;
    username?: string | null;
    avatarId?: string | null;
    joinedAt: number;
    lastHeartbeatAt: number;
  }>;
  queueCount: number;
  estimatedWaitMs?: number;
  status: SoulGameQueueStatus;
}

export interface SoulGameFocusWindow {
  id: string;
  startsAt: number;
  endsAt: number;
  durationMs: number;
}

export interface SoulGameFocusTarget {
  queueEntryId: string;
  username?: string | null;
  avatarId?: string | null;
}

export interface SoulGameHoldState {
  pressEventId: string;
  progressMs: number;
  progressRatio: number;
  isReady: boolean;
}

export interface SoulGamePartnerHoldState {
  queueEntryId: string;
  progressMs: number;
  progressRatio: number;
  isReady: boolean;
  isVisible: boolean;
}

export interface SoulGameDemoMatch {
  matchId: string;
  status: "pending_intro" | "ended";
  matchedUser: {
    queueEntryId?: string | null;
    username?: string | null;
    avatarId?: string | null;
  };
  windowId: string;
}

export interface SoulGameViewModel {
  uiState: SoulGameUiStateKey;
  isPressing: boolean;
  queueSnapshot: SoulGameQueueSnapshot | null;
  focusWindow: SoulGameFocusWindow | null;
  focusTarget: SoulGameFocusTarget | null;
  selfHold: SoulGameHoldState | null;
  partnerReciprocalHold: SoulGamePartnerHoldState | null;
  demoMatch: SoulGameDemoMatch | null;
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
  targetQueueEntryId: string;
  focusWindowId: string;
}

export interface SoulGamePressCommitArgs {
  queueEntryId: string;
  pressEventId: string;
  targetQueueEntryId: string;
  focusWindowId: string;
}

export interface SoulGamePressCancelArgs {
  queueEntryId: string;
  pressEventId: string;
}

export type SoulGameSafeErrorCode =
  | "QUEUE_JOIN_FAILED"
  | "QUEUE_HEARTBEAT_FAILED"
  | "PRESS_START_FAILED"
  | "PRESS_END_FAILED"
  | "MATCH_SYNC_FAILED"
  | "UNKNOWN";

const soulGameSafeErrorMessages: Record<SoulGameSafeErrorCode, string> = {
  QUEUE_JOIN_FAILED: "We could not join the Soul Game queue. Please try again.",
  QUEUE_HEARTBEAT_FAILED: "Connection looks unstable. We are trying to keep your queue status active.",
  PRESS_START_FAILED: "Your fingerprint hold did not start correctly. Press again while the center avatar is active.",
  PRESS_END_FAILED: "Your hold could not be completed. Try again on the next center chance.",
  MATCH_SYNC_FAILED: "We could not sync your Soul Game state yet. Please wait a moment and retry.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function getSoulGameInlineMessageForState(
  uiState: SoulGameUiStateKey,
  toneOverride?: "default" | "success" | "error",
): SoulGameViewModel["inlineMessage"] {
  const base = soulGameInlineStatusCopy[uiState];
  const tone =
    toneOverride ?? (uiState === "matched"
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
