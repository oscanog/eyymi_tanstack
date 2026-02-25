import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  resolveSoulAvatarVariant,
  SoulAvatarIcon,
  SoulGameIcon,
  getSoulAvatarVariantByIndex,
} from "@/components/icons";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useConvexSubscription } from "@/hooks";
import { convexMutation } from "@/lib/convex";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import {
  getSoulGameAvatarById,
  soulGameActionCopy,
  soulGameAvatarCatalog,
  soulGameTimingConfig,
  type SoulGameUiStateKey,
} from "../../data";
import {
  getSoulGameInlineMessageForState,
  mapSoulGameErrorToInlineMessage,
} from "../features/soul-game/contracts";

type JoinQueueResult = {
  queueEntryId: string;
  status: "queued" | "matched";
  joinedAt: number;
  serverNow: number;
};

type PressStartResult = {
  ok: boolean;
  pressEventId?: string;
  reason?: string;
  serverNow: number;
};

type PressEndResult = {
  ok: boolean;
  matched: boolean;
  matchId?: string;
  sessionId?: string | null;
  overlapMs?: number;
  reason?: string;
  durationMs?: number;
  serverNow: number;
};

type SoulGameClientState = {
  serverNow: number;
  queueSnapshot: {
    self: {
      queueEntryId: string;
      username?: string | null;
      avatarId?: string | null;
      joinedAt: number;
      lastHeartbeatAt: number;
      isActive: boolean;
    } | null;
    onlineCandidates: Array<{
      queueEntryId: string;
      username?: string | null;
      avatarId?: string | null;
      joinedAt: number;
      lastHeartbeatAt: number;
    }>;
    queueCount: number;
    estimatedWaitMs?: number;
    status: "inactive" | "queued" | "matching" | "matched";
  };
  activePress: {
    _id: string;
    pressStartedAt: number;
    pressEndedAt?: number;
    durationMs?: number;
    status: "pending" | "matched" | "expired" | "cancelled";
  } | null;
  matchSnapshot: {
    matchId: string;
    overlapMs: number;
    createdAt: number;
    status: "pending_intro" | "active_2min" | "ended" | "cancelled";
    conversationEndsAt?: number | null;
  } | null;
  session: {
    sessionId: string;
    matchId: string;
    status: "pending_intro" | "active_2min" | "ended" | "cancelled";
    matchedUser: {
      username?: string | null;
      avatarId?: string | null;
    };
    conversationEndsAt: number;
    effectiveSessionStatus?: "active" | "ended" | "cancelled" | null;
  } | null;
};

export const Route = createFileRoute("/soul_game")({
  component: SoulGameRoute,
});

function formatCountdown(msRemaining: number) {
  const safe = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getDeterministicAvatarVariant(input: string | undefined | null, fallbackIndex = 0) {
  if (!input) return getSoulAvatarVariantByIndex(fallbackIndex);
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return getSoulAvatarVariantByIndex(hash % 10);
}

function getBoundSoulAvatarVariant(
  avatarId: string | undefined | null,
  fallbackInput: string | undefined | null,
  fallbackIndex = 0,
) {
  const meta = getSoulGameAvatarById(avatarId);
  if (meta) {
    return resolveSoulAvatarVariant(meta.iconKey, fallbackIndex);
  }
  return getDeterministicAvatarVariant(fallbackInput, fallbackIndex);
}

function SoulGameRoute() {
  const hasOtpAuth = otpAuthStorage.hasValidSession();
  const otpSession = otpAuthStorage.getSession();
  const username = storage.getUsername() ?? "you";
  const profileUserId = storage.getUserId() ?? undefined;

  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [pressEventId, setPressEventId] = useState<string | null>(null);
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isSubmittingPress, setIsSubmittingPress] = useState(false);
  const [localUiState, setLocalUiState] = useState<SoulGameUiStateKey>("idle");
  const [inlineErrorCode, setInlineErrorCode] = useState<
    | "QUEUE_JOIN_FAILED"
    | "QUEUE_HEARTBEAT_FAILED"
    | "PRESS_START_FAILED"
    | "PRESS_END_FAILED"
    | "MATCH_SYNC_FAILED"
    | "SESSION_START_FAILED"
    | "UNKNOWN"
    | null
  >(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastLocalAvatarId = useMemo(() => soulGameAvatarCatalog[0]?.id ?? "soul-ava-01", []);

  const {
    data: clientState,
    isLoading: isClientStateLoading,
    error: clientStateError,
  } = useConvexSubscription<SoulGameClientState>(
    "soulGameMatch:getClientState",
    queueEntryId ? { queueEntryId } : {},
    soulGameTimingConfig.matchPollMs,
  );

  useEffect(() => {
    if (!clientStateError) return;
    setInlineErrorCode("MATCH_SYNC_FAILED");
  }, [clientStateError]);

  useEffect(() => {
    if (!autoJoinEnabled || !hasOtpAuth || !otpSession || queueEntryId || isJoining) return;

    let cancelled = false;
    setIsJoining(true);
    setInlineErrorCode(null);

    void convexMutation<JoinQueueResult>("soulGamePresence:joinQueue", {
      authUserId: otpSession.authUserId,
      profileUserId,
      username,
      avatarId: lastLocalAvatarId,
    })
      .then((result) => {
        if (cancelled) return;
        setQueueEntryId(result.queueEntryId);
        setLocalUiState(result.status === "matched" ? "matched" : "queueing");
      })
      .catch((error) => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.error("[SoulGame] joinQueue failed", error);
        }
        setAutoJoinEnabled(false);
        setInlineErrorCode("QUEUE_JOIN_FAILED");
        setLocalUiState("error");
      })
      .finally(() => {
        if (!cancelled) setIsJoining(false);
      });

    return () => {
      cancelled = true;
    };
  }, [autoJoinEnabled, hasOtpAuth, otpSession, queueEntryId, isJoining, profileUserId, username, lastLocalAvatarId]);

  useEffect(() => {
    if (!queueEntryId) return;

    const sendHeartbeat = async () => {
      try {
        await convexMutation("soulGamePresence:heartbeat", { queueEntryId });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[SoulGame] heartbeat failed", error);
        }
        setInlineErrorCode((prev) => prev ?? "QUEUE_HEARTBEAT_FAILED");
      }
    };

    void sendHeartbeat();
    heartbeatTimerRef.current = window.setInterval(sendHeartbeat, soulGameTimingConfig.queueHeartbeatMs);

    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [queueEntryId]);

  useEffect(() => {
    return () => {
      if (!queueEntryId) return;
      void convexMutation("soulGamePresence:leaveQueue", { queueEntryId }).catch(() => {});
    };
  }, [queueEntryId]);

  useEffect(() => {
    if (!clientState) return;

    if (clientState.session) {
      const ended =
        clientState.session.effectiveSessionStatus === "ended" ||
        (clientState.session.conversationEndsAt ?? 0) <= clientState.serverNow;
      setLocalUiState(ended ? "idle" : "session");
      return;
    }

    if (clientState.matchSnapshot?.status === "pending_intro" || clientState.matchSnapshot?.status === "active_2min") {
      setLocalUiState("matched");
      return;
    }

    if (isPressing) {
      setLocalUiState("pressing");
      return;
    }

    if (clientState.queueSnapshot.self) {
      setLocalUiState("queueing");
      return;
    }

    setLocalUiState("idle");
  }, [clientState, isPressing]);

  const inlineMessage = useMemo(() => {
    if (inlineErrorCode) {
      return mapSoulGameErrorToInlineMessage(inlineErrorCode);
    }
    return getSoulGameInlineMessageForState(localUiState);
  }, [inlineErrorCode, localUiState]);

  const statusTone = inlineMessage.tone === "success" ? "success" : inlineMessage.tone === "error" ? "error" : "info";

  const queueCount = clientState?.queueSnapshot.queueCount ?? 0;
  const candidates = clientState?.queueSnapshot.onlineCandidates ?? [];
  const highlightedIndex = Math.floor((clientState?.serverNow ?? Date.now()) / soulGameTimingConfig.candidateRotateMs) % Math.max(candidates.length || 1, 1);
  const highlightedCandidate = candidates.length ? candidates[highlightedIndex] : null;
  const highlightedAvatarVariant = getBoundSoulAvatarVariant(
    highlightedCandidate?.avatarId,
    highlightedCandidate?.queueEntryId ?? highlightedCandidate?.username,
    highlightedIndex,
  );
  const countdownMs = clientState?.session ? clientState.session.conversationEndsAt - (clientState.serverNow ?? Date.now()) : 0;
  const isQueueReady = Boolean(queueEntryId) && Boolean(clientState?.queueSnapshot.self);
  const isMatchedOrSession = localUiState === "matched" || localUiState === "session";

  const handlePressStart = async (pointerId: number) => {
    if (!queueEntryId || isSubmittingPress || isMatchedOrSession) return;
    activePointerIdRef.current = pointerId;
    setInlineErrorCode(null);
    setIsPressing(true);
    setLocalUiState("pressing");

    try {
      const result = await convexMutation<PressStartResult>("soulGameMatch:pressStart", { queueEntryId });
      if (!result.ok || !result.pressEventId) {
        setInlineErrorCode("PRESS_START_FAILED");
        setIsPressing(false);
        setLocalUiState("queueing");
        return;
      }
      setPressEventId(result.pressEventId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[SoulGame] pressStart failed", error);
      }
      setInlineErrorCode("PRESS_START_FAILED");
      setIsPressing(false);
      setLocalUiState("error");
    }
  };

  const handlePressEnd = async (pointerId?: number) => {
    if (pointerId !== undefined && activePointerIdRef.current !== null && pointerId !== activePointerIdRef.current) {
      return;
    }
    activePointerIdRef.current = null;

    if (!queueEntryId || !pressEventId) {
      setIsPressing(false);
      return;
    }

    setIsSubmittingPress(true);
    setIsPressing(false);

    try {
      const result = await convexMutation<PressEndResult>("soulGameMatch:pressEnd", {
        queueEntryId,
        pressEventId,
      });

      if (!result.ok) {
        setInlineErrorCode("PRESS_END_FAILED");
        setLocalUiState("error");
      } else if (result.matched) {
        setInlineErrorCode(null);
        setLocalUiState("matched");
      } else {
        setInlineErrorCode(null);
        setLocalUiState("queueing");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[SoulGame] pressEnd failed", error);
      }
      setInlineErrorCode("PRESS_END_FAILED");
      setLocalUiState("error");
    } finally {
      setPressEventId(null);
      setIsSubmittingPress(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!queueEntryId) return;
    try {
      setAutoJoinEnabled(false);
      await convexMutation("soulGamePresence:leaveQueue", { queueEntryId });
      setQueueEntryId(null);
      setPressEventId(null);
      setIsPressing(false);
      setInlineErrorCode(null);
      setLocalUiState("idle");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[SoulGame] leaveQueue failed", error);
      }
      setInlineErrorCode("UNKNOWN");
    }
  };

  const handleJoinQueueManual = async () => {
    if (queueEntryId || isJoining || !otpSession) return;
    setAutoJoinEnabled(true);
  };

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-navy-bg)] px-4 pt-4 pb-6">
        <header className="safe-area-inset">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 text-sm font-medium"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <SoulGameIcon className="h-8 w-8" />
              <h1 className="text-lg font-semibold tracking-tight">Soul game</h1>
            </div>
            <button
              type="button"
              onClick={handleLeaveQueue}
              disabled={!queueEntryId}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 text-xs font-medium disabled:opacity-50"
            >
              {soulGameActionCopy.leaveQueue}
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Press and hold the circle. Matching happens on the server when press intervals overlap.
          </p>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="mt-4">
            <StatusMessage
              tone={statusTone}
              title={inlineMessage.title}
              message={inlineMessage.description}
            />
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Queue
                </p>
                <p className="mt-1 text-base font-semibold">{queueCount} online in Soul Game</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {isClientStateLoading && !clientState
                    ? "Syncing queue..."
                    : clientState?.queueSnapshot.estimatedWaitMs
                      ? `Estimated wait ~${Math.ceil(clientState.queueSnapshot.estimatedWaitMs / 1000)}s`
                      : "Waiting for another player to hold"}
                </p>
              </div>
              <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-1 text-xs">
                @{username}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Rotating focus
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {highlightedCandidate?.username ? `@${highlightedCandidate.username}` : "Waiting for players"}
                  </p>
                </div>
                <div className="relative">
                  <span
                    className="absolute inset-[-6px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18)_0%,rgba(20,184,166,0)_70%)] motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                  <div className="relative rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-navy-surface)] p-1.5">
                    <SoulAvatarIcon variant={highlightedAvatarVariant} className="h-14 w-14" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const candidate = candidates[index];
                const isHighlighted = highlightedCandidate?.queueEntryId === candidate?.queueEntryId;
                const avatarVariant = getBoundSoulAvatarVariant(
                  candidate?.avatarId,
                  candidate?.queueEntryId ?? candidate?.username,
                  index,
                );
                return (
                  <div
                    key={candidate?.queueEntryId ?? `placeholder-${index}`}
                    className={`rounded-2xl border p-2 text-center transition motion-reduce:transition-none ${
                      isHighlighted
                        ? "scale-[1.03] border-[var(--color-rose)] bg-[var(--color-rose)]/10"
                        : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                    }`}
                  >
                    <SoulAvatarIcon variant={avatarVariant} className="mx-auto h-10 w-10" />
                    <p className="mt-1 truncate text-[10px] text-[var(--color-text-secondary)]">
                      {candidate?.username ? `@${candidate.username}` : "Waiting"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {clientState?.session ? (
            <section className="mt-4 rounded-2xl border border-[color:rgba(34,197,94,0.25)] bg-[color:rgba(34,197,94,0.08)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                2-minute conversation
              </p>
              <p className="mt-1 text-base font-semibold">
                @{clientState.session.matchedUser.username ?? "friend"} eyy to you, beginning your 2-minute conversation session
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Time remaining: {formatCountdown(countdownMs)}
              </p>
            </section>
          ) : null}

          <section className="mt-auto pt-8">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>Server overlap rule</span>
                <span>{soulGameTimingConfig.minOverlapMs}ms min overlap</span>
              </div>

              <button
                type="button"
                disabled={!isQueueReady || isSubmittingPress || isMatchedOrSession}
                onPointerDown={(event) => {
                  event.preventDefault();
                  if (!isQueueReady) {
                    void handleJoinQueueManual();
                    return;
                  }
                  void handlePressStart(event.pointerId);
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  void handlePressEnd(event.pointerId);
                }}
                onPointerCancel={(event) => {
                  event.preventDefault();
                  void handlePressEnd(event.pointerId);
                }}
                onPointerLeave={(event) => {
                  if (!isPressing) return;
                  void handlePressEnd(event.pointerId);
                }}
                className={`group relative flex h-36 w-full touch-none items-center justify-center rounded-full border text-base font-semibold shadow-[0_24px_45px_rgba(0,0,0,0.22)] transition duration-200 motion-reduce:transition-none disabled:opacity-60 ${
                  isPressing
                    ? "scale-[1.02] border-[var(--color-rose)] bg-[var(--color-rose)]/15"
                    : isMatchedOrSession
                      ? "border-[var(--color-rose)] bg-[var(--color-rose)]/20"
                      : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                }`}
                aria-label={`${soulGameActionCopy.pressToMatch} to Soul Game match`}
              >
                <span className="absolute inset-3 rounded-full border border-white/10" aria-hidden="true" />
                <span
                  className={`absolute inset-0 rounded-full transition motion-reduce:transition-none ${
                    isMatchedOrSession
                      ? "animate-pulse bg-[radial-gradient(circle,rgba(20,184,166,0.20)_0%,rgba(20,184,166,0)_65%)]"
                      : isPressing
                        ? "bg-[radial-gradient(circle,rgba(20,184,166,0.16)_0%,rgba(20,184,166,0)_70%)]"
                        : "opacity-0"
                  }`}
                  aria-hidden="true"
                />
                <span className="relative z-10">
                  {!isQueueReady
                    ? isJoining
                      ? "Joining queue..."
                      : soulGameActionCopy.joinQueue
                    : isSubmittingPress
                      ? "Submitting..."
                      : isPressing
                        ? soulGameActionCopy.releaseToSubmit
                        : soulGameActionCopy.pressToMatch}
                </span>
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-2">
                  Hold {" >="} {soulGameTimingConfig.minHoldMs}ms
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-2">
                  Session = {soulGameTimingConfig.sessionDurationMs / 60000} min
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default SoulGameRoute;
