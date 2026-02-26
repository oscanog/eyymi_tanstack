import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import {
  resolveSoulAvatarVariant,
  SoulAvatarIcon,
  SoulGameIcon,
  getSoulAvatarVariantByIndex,
} from "@/components/icons";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useConvexSubscription, useOnlineUsers, usePresenceHeartbeat } from "@/hooks";
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

type SoulGameDebugEvent = {
  id: number;
  at: string;
  event: string;
  detail?: Record<string, unknown>;
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
  activeCandidateHolds?: Array<{
    queueEntryId: string;
    holdDurationMs: number;
    pressStartedAt: number;
  }>;
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
    partnerPressDurationMs?: number | null;
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
    partnerPressDurationMs?: number | null;
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

function formatSecondsLabel(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "0.0s";
  return `${(ms / 1000).toFixed(1)}s`;
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
  const isDevDebug = import.meta.env.DEV;
  const navigate = useNavigate();
  usePresenceHeartbeat();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasOtpAuth = isHydrated ? otpAuthStorage.hasValidSession() : true;
  const otpSession = isHydrated ? otpAuthStorage.getSession() : null;
  const username = isHydrated ? storage.getUsername() ?? "you" : "you";
  const profileUserId = isHydrated ? storage.getUserId() ?? undefined : undefined;

  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [pressEventId, setPressEventId] = useState<string | null>(null);
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isSubmittingPress, setIsSubmittingPress] = useState(false);
  const [pressStartedAtMs, setPressStartedAtMs] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [joinStartedAtMs, setJoinStartedAtMs] = useState<number | null>(null);
  const [joinElapsedMs, setJoinElapsedMs] = useState(0);
  const [debugEvents, setDebugEvents] = useState<SoulGameDebugEvent[]>([]);
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
  const redirectedSessionIdRef = useRef<string | null>(null);
  const debugSeqRef = useRef(0);
  const lastLocalAvatarId = useMemo(() => soulGameAvatarCatalog[0]?.id ?? "soul-ava-01", []);

  const pushDebugEvent = (event: string, detail?: Record<string, unknown>) => {
    if (!isDevDebug) return;
    const row: SoulGameDebugEvent = {
      id: ++debugSeqRef.current,
      at: new Date().toLocaleTimeString(),
      event,
      detail,
    };
    console.log("[SoulGameDebug]", row.event, row.detail ?? {});
    setDebugEvents((prev) => [row, ...prev].slice(0, 10));
  };

  const {
    data: clientState,
    isLoading: isClientStateLoading,
    error: clientStateError,
  } = useConvexSubscription<SoulGameClientState>(
    "soulGameMatch:getClientState",
    queueEntryId ? { queueEntryId } : {},
    soulGameTimingConfig.matchPollMs,
  );
  const { users: appOnlineUsers, error: appOnlineUsersError } = useOnlineUsers(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!clientStateError) return;
    pushDebugEvent("subscription:error", {
      message: clientStateError.message,
    });
    setInlineErrorCode("MATCH_SYNC_FAILED");
  }, [clientStateError]);

  useEffect(() => {
    if (!autoJoinEnabled || !hasOtpAuth || !otpSession || queueEntryId || isJoining) return;

    let cancelled = false;
    setIsJoining(true);
    setJoinStartedAtMs(Date.now());
    setJoinElapsedMs(0);
    setInlineErrorCode(null);
    pushDebugEvent("joinQueue:request", {
      username,
      hasOtp: Boolean(otpSession?.authUserId),
      profileUserId: profileUserId ?? null,
    });

    const joinAbortController = new AbortController();
    const joinTimeoutId = window.setTimeout(() => {
      pushDebugEvent("joinQueue:abortTimeout", {
        elapsedMs: Date.now() - (joinStartedAtMs ?? Date.now()),
        timeoutMs: 10000,
      });
      joinAbortController.abort();
    }, 10000);

    void convexMutation<JoinQueueResult>("soulGamePresence:joinQueue", {
      authUserId: otpSession.authUserId,
      profileUserId,
      username,
      avatarId: lastLocalAvatarId,
    }, { maxRetries: 0 }, { signal: joinAbortController.signal })
      .then((result) => {
        if (cancelled) return;
        pushDebugEvent("joinQueue:response", {
          queueEntryId: result.queueEntryId,
          status: result.status,
          serverNow: result.serverNow,
        });
        setQueueEntryId(result.queueEntryId);
        setLocalUiState(result.status === "matched" ? "matched" : "queueing");
      })
      .catch((error) => {
        if (cancelled) return;
        pushDebugEvent("joinQueue:error", {
          name: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
        });
        if (import.meta.env.DEV) {
          console.error("[SoulGame] joinQueue failed", error);
        }
        setAutoJoinEnabled(false);
        setInlineErrorCode("QUEUE_JOIN_FAILED");
        setLocalUiState("error");
      })
      .finally(() => {
        if (!cancelled) {
          setIsJoining(false);
          setJoinStartedAtMs(null);
          setJoinElapsedMs(0);
        }
        window.clearTimeout(joinTimeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(joinTimeoutId);
      joinAbortController.abort();
    };
  }, [autoJoinEnabled, hasOtpAuth, otpSession, queueEntryId, isJoining, profileUserId, username, lastLocalAvatarId, joinStartedAtMs]);

  useEffect(() => {
    if (!isJoining || joinStartedAtMs === null) {
      setJoinElapsedMs(0);
      return;
    }

    let hasWarnedSlow = false;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - joinStartedAtMs;
      setJoinElapsedMs(elapsed);

      if (!hasWarnedSlow && elapsed >= 5000) {
        hasWarnedSlow = true;
        pushDebugEvent("joinQueue:slow", {
          elapsedMs: elapsed,
          elapsedSec: Number((elapsed / 1000).toFixed(1)),
          queueEntryId: queueEntryId ?? null,
          isJoining,
        });
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isJoining, joinStartedAtMs, queueEntryId]);

  useEffect(() => {
    if (!queueEntryId) return;

    const sendHeartbeat = async () => {
      try {
        pushDebugEvent("heartbeat:request", { queueEntryId });
        await convexMutation("soulGamePresence:heartbeat", { queueEntryId });
        pushDebugEvent("heartbeat:response", { queueEntryId, ok: true });
      } catch (error) {
        pushDebugEvent("heartbeat:error", {
          queueEntryId,
          message: error instanceof Error ? error.message : String(error),
        });
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
    if (!isDevDebug || typeof window === "undefined") return;
    (window as Window & { __SOUL_GAME_DEBUG__?: unknown }).__SOUL_GAME_DEBUG__ = {
      queueEntryId,
      pressEventId,
      isPressing,
      isSubmittingPress,
      holdProgress,
      localUiState,
      latestClientState: clientState,
      latestDebugEvents: debugEvents,
    };
  }, [
    isDevDebug,
    queueEntryId,
    pressEventId,
    isPressing,
    isSubmittingPress,
    holdProgress,
    localUiState,
    clientState,
    debugEvents,
  ]);

  useEffect(() => {
    if (!isPressing || pressStartedAtMs === null) {
      setHoldProgress(0);
      return;
    }

    let rafId = 0;
    const tick = () => {
      const elapsed = Date.now() - pressStartedAtMs;
      const nextProgress = Math.min(1, elapsed / soulGameTimingConfig.minHoldMs);
      setHoldProgress(nextProgress);
      if (nextProgress < 1 && isPressing) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isPressing, pressStartedAtMs]);

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

  useEffect(() => {
    const session = clientState?.session;
    if (!session || !queueEntryId) return;
    const effectiveStatus = session.effectiveSessionStatus ?? "active";
    const isActive = effectiveStatus === "active" && session.conversationEndsAt > (clientState?.serverNow ?? Date.now());
    if (!isActive) return;
    if (redirectedSessionIdRef.current === session.sessionId) return;

    redirectedSessionIdRef.current = session.sessionId;
    pushDebugEvent("chat:navigate", {
      sessionId: session.sessionId,
      queueEntryId,
    });

    void navigate({
      to: "/soul_game/chat/$sessionId",
      params: { sessionId: session.sessionId },
      search: { queueEntryId },
      replace: true,
    });
  }, [
    clientState?.serverNow,
    clientState?.session,
    navigate,
    queueEntryId,
  ]);

  const inlineMessage = useMemo(() => {
    if (inlineErrorCode) {
      return mapSoulGameErrorToInlineMessage(inlineErrorCode);
    }
    return getSoulGameInlineMessageForState(localUiState);
  }, [inlineErrorCode, localUiState]);

  const statusTone = inlineMessage.tone === "success" ? "success" : inlineMessage.tone === "error" ? "error" : "info";

  const appOnlineCount = appOnlineUsers.length;
  const rawCandidates = clientState?.queueSnapshot.onlineCandidates ?? [];
  const candidates = rawCandidates.filter((candidate) => {
    if (queueEntryId && candidate.queueEntryId === queueEntryId) return false;
    if (candidate.username && candidate.username === username) return false;
    return true;
  });
  const availableOpponentCount = candidates.length;
  const activeCandidateHolds = clientState?.activeCandidateHolds ?? [];
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
  const highlightedCandidateHold = highlightedCandidate
    ? activeCandidateHolds.find((hold) => hold.queueEntryId === highlightedCandidate.queueEntryId) ?? null
    : null;
  const strongestCandidateHold = activeCandidateHolds[0] ?? null;
  const selfHoldDurationMs =
    isPressing && pressStartedAtMs !== null ? Math.max(0, Date.now() - pressStartedAtMs) : null;

  const partnerPressLabel = useMemo(() => {
    if (clientState?.session?.partnerPressDurationMs) {
      return `Your matching partner pressed for ${formatSecondsLabel(clientState.session.partnerPressDurationMs)}.`;
    }

    if (clientState?.matchSnapshot?.partnerPressDurationMs) {
      return `Your matching partner pressed for ${formatSecondsLabel(clientState.matchSnapshot.partnerPressDurationMs)}.`;
    }

    if (selfHoldDurationMs) {
      return `You have pressed for ${formatSecondsLabel(selfHoldDurationMs)}. Keep holding.`;
    }

    if (highlightedCandidate && highlightedCandidateHold) {
      const name = highlightedCandidate.username ? `@${highlightedCandidate.username}` : "A player";
      return `${name} has pressed for ${formatSecondsLabel(highlightedCandidateHold.holdDurationMs)}.`;
    }

    if (strongestCandidateHold) {
      return `Someone is pressing for ${formatSecondsLabel(strongestCandidateHold.holdDurationMs)}.`;
    }

    return "When another player presses, their hold time will appear here.";
  }, [
    clientState?.matchSnapshot?.partnerPressDurationMs,
    clientState?.session?.partnerPressDurationMs,
    highlightedCandidate,
    highlightedCandidateHold,
    selfHoldDurationMs,
    strongestCandidateHold,
  ]);

  const estimatedWaitMinutes = clientState?.queueSnapshot.estimatedWaitMs
    ? Math.max(1, Math.ceil(clientState.queueSnapshot.estimatedWaitMs / 60000))
    : 3;
  const queueDisplayNumber = isQueueReady
    ? String(Math.max(1, clientState?.queueSnapshot.queueCount ?? 1))
    : isJoining
      ? "..."
      : "--";

  const soulGamePrimaryActionLabel = !isQueueReady
    ? isJoining
      ? "Joining queue..."
      : soulGameActionCopy.joinQueue
    : isSubmittingPress
      ? "Submitting..."
      : isPressing
        ? soulGameActionCopy.releaseToSubmit
        : soulGameActionCopy.pressToMatch;

  const statusChipColor =
    statusTone === "success"
      ? "rgba(34,197,94,0.16)"
      : statusTone === "error"
        ? "rgba(239,68,68,0.16)"
        : "rgba(20,184,166,0.14)";

  const statusChipBorderColor =
    statusTone === "success"
      ? "rgba(34,197,94,0.28)"
      : statusTone === "error"
        ? "rgba(239,68,68,0.28)"
        : "rgba(20,184,166,0.22)";

  const visualOtherCandidates = highlightedCandidate
    ? candidates.filter((candidate) => candidate.queueEntryId !== highlightedCandidate.queueEntryId)
    : candidates;
  const visualCarouselCandidates = [
    visualOtherCandidates[0] ?? null,
    visualOtherCandidates[1] ?? null,
    highlightedCandidate ?? null,
    visualOtherCandidates[2] ?? null,
    visualOtherCandidates[3] ?? null,
  ];

  const handlePressStart = async (pointerId: number) => {
    if (!queueEntryId || isSubmittingPress || isMatchedOrSession) {
      pushDebugEvent("press:pointerDown:ignored", {
        queueEntryId,
        isSubmittingPress,
        isMatchedOrSession,
      });
      return;
    }
    activePointerIdRef.current = pointerId;
    pushDebugEvent("press:pointerDown", {
      pointerId,
      queueEntryId,
      existingPressEventId: pressEventId,
    });
    setInlineErrorCode(null);
    setIsPressing(true);
    setPressStartedAtMs(Date.now());
    setLocalUiState("pressing");

    try {
      pushDebugEvent("pressStart:request", { queueEntryId });
      const result = await convexMutation<PressStartResult>("soulGameMatch:pressStart", { queueEntryId });
      pushDebugEvent("pressStart:response", {
        ok: result.ok,
        pressEventId: result.pressEventId ?? null,
        reason: result.reason ?? null,
        serverNow: result.serverNow,
      });
      if (!result.ok || !result.pressEventId) {
        setInlineErrorCode("PRESS_START_FAILED");
        setIsPressing(false);
        setPressStartedAtMs(null);
        setLocalUiState("queueing");
        return;
      }
      setPressEventId(result.pressEventId);
    } catch (error) {
      pushDebugEvent("pressStart:error", {
        message: error instanceof Error ? error.message : String(error),
      });
      if (import.meta.env.DEV) {
        console.error("[SoulGame] pressStart failed", error);
      }
      setInlineErrorCode("PRESS_START_FAILED");
      setIsPressing(false);
      setPressStartedAtMs(null);
      setLocalUiState("error");
    }
  };

  const handlePressEnd = async (pointerId?: number) => {
    if (pointerId !== undefined && activePointerIdRef.current !== null && pointerId !== activePointerIdRef.current) {
      pushDebugEvent("press:pointerUp:ignoredPointerMismatch", {
        pointerId,
        activePointerId: activePointerIdRef.current,
      });
      return;
    }
    pushDebugEvent("press:pointerUp", {
      pointerId: pointerId ?? null,
      activePointerId: activePointerIdRef.current,
      queueEntryId,
      pressEventId,
    });
    activePointerIdRef.current = null;

    if (!queueEntryId || !pressEventId) {
      pushDebugEvent("pressEnd:skippedMissingIds", {
        queueEntryId,
        pressEventId,
      });
      setIsPressing(false);
      return;
    }

    setIsSubmittingPress(true);
    setIsPressing(false);
    setPressStartedAtMs(null);

    try {
      pushDebugEvent("pressEnd:request", {
        queueEntryId,
        pressEventId,
      });
      const result = await convexMutation<PressEndResult>("soulGameMatch:pressEnd", {
        queueEntryId,
        pressEventId,
      });
      pushDebugEvent("pressEnd:response", {
        ok: result.ok,
        matched: result.matched,
        reason: result.reason ?? null,
        matchId: result.matchId ?? null,
        sessionId: result.sessionId ?? null,
        overlapMs: result.overlapMs ?? null,
        durationMs: result.durationMs ?? null,
        serverNow: result.serverNow,
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
      pushDebugEvent("pressEnd:error", {
        message: error instanceof Error ? error.message : String(error),
      });
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
      pushDebugEvent("leaveQueue:request", { queueEntryId });
      await convexMutation("soulGamePresence:leaveQueue", { queueEntryId });
      pushDebugEvent("leaveQueue:response", { queueEntryId, ok: true });
      setQueueEntryId(null);
      setPressEventId(null);
      setIsPressing(false);
      setPressStartedAtMs(null);
      setInlineErrorCode(null);
      setLocalUiState("idle");
    } catch (error) {
      pushDebugEvent("leaveQueue:error", {
        queueEntryId,
        message: error instanceof Error ? error.message : String(error),
      });
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center px-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Loading Soul Game...
          </div>
        </div>
      </div>
    );
  }

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <style>{`
        @keyframes soul-copy-title-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        @keyframes soul-copy-center-pulse {
          0%, 100% { transform: scale(1.5); }
          50% { transform: scale(1.56); }
        }
        @keyframes soul-copy-center-glow {
          0%, 100% { transform: scale(1.1); opacity: 0.28; }
          50% { transform: scale(1.3); opacity: 0.48; }
        }
        @media (prefers-reduced-motion: reduce) {
          .soul-copy-title-anim,
          .soul-copy-center-anim,
          .soul-copy-center-glow {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden px-5 pb-6 pt-4"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(20,184,166,0.14) 0%, rgba(20,184,166,0) 58%), linear-gradient(180deg, var(--color-navy-bg) 0%, var(--color-navy-surface) 100%)",
        }}
      >
        <header className="safe-area-inset">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 text-sm font-medium"
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
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 text-xs font-medium disabled:opacity-50"
            >
              {soulGameActionCopy.leaveQueue}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <div className="mt-4">
            <div
              className="rounded-2xl border px-3 py-2"
              style={{
                backgroundColor: statusChipColor,
                borderColor: statusChipBorderColor,
              }}
            >
              <p className="text-sm font-semibold">{inlineMessage.title}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {inlineMessage.description}
              </p>
            </div>
          </div>

          {clientState?.session ? (
            <div className="mt-3 rounded-2xl border border-[color:rgba(34,197,94,0.25)] bg-[color:rgba(34,197,94,0.08)] px-3 py-2">
              <p className="text-xs text-[var(--color-text-secondary)]">
                @{clientState.session.matchedUser.username ?? "friend"} matched. Redirecting to chat...
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--color-text-primary)]">
                Time remaining: {formatCountdown(countdownMs)}
              </p>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col items-center justify-center">
            <h2
              className="soul-copy-title-anim mb-3 text-5xl font-bold text-[var(--color-rose-light)]"
              style={{ animation: "soul-copy-title-pulse 1.5s ease-in-out infinite" }}
            >
              Matching
            </h2>

            <p className="mb-3 text-center text-sm text-[var(--color-text-secondary)]">
              Queuing number{" "}
              <span className="font-semibold text-[var(--color-rose-light)]">{queueDisplayNumber}</span>, Wait
              about <span className="font-semibold text-[var(--color-text-primary)]">{estimatedWaitMinutes}</span>{" "}
              minute(s)
            </p>

            <p className="mb-8 text-center text-xs text-[var(--color-text-muted)]">
              {availableOpponentCount} online candidate{availableOpponentCount === 1 ? "" : "s"} • @{username}
              {isClientStateLoading && !clientState ? " • syncing..." : ""}
              {appOnlineUsersError ? " • app presence limited" : ` • app online ${appOnlineCount}`}
            </p>

            <div className="relative mb-10 flex h-40 w-full max-w-sm items-center justify-center">
              {([
                { x: -180, scale: 0.8, opacity: 0.3, blur: 8, isCenter: false },
                { x: -100, scale: 1, opacity: 0.6, blur: 2, isCenter: false },
                { x: 0, scale: 1.5, opacity: 1, blur: 0, isCenter: true },
                { x: 100, scale: 1, opacity: 0.6, blur: 2, isCenter: false },
                { x: 180, scale: 0.8, opacity: 0.3, blur: 8, isCenter: false },
              ] as const).map((slot, index) => {
                const candidate = visualCarouselCandidates[index];
                const avatarVariant = getBoundSoulAvatarVariant(
                  candidate?.avatarId,
                  candidate?.queueEntryId ?? candidate?.username,
                  index,
                );
                const isCenter = slot.isCenter;
                const isHolding =
                  candidate && activeCandidateHolds.some((hold) => hold.queueEntryId === candidate.queueEntryId);

                return (
                  <div
                    key={candidate?.queueEntryId ?? `copy-slot-${index}`}
                    className="absolute"
                    style={{
                      transform: `translateX(${slot.x}px)`,
                      opacity: slot.opacity,
                      filter: `blur(${slot.blur}px) ${isCenter ? "saturate(1)" : "saturate(0.65)"}`,
                    }}
                  >
                    <div
                      className={isCenter ? "soul-copy-center-anim" : undefined}
                      style={{
                        transform: `scale(${slot.scale})`,
                        animation: isCenter ? "soul-copy-center-pulse 2s ease-in-out infinite" : undefined,
                      }}
                    >
                      <div className="relative">
                        {isCenter ? (
                          <div
                            className="soul-copy-center-glow absolute inset-0 rounded-full bg-[var(--color-rose)]"
                            style={{
                              filter: "blur(20px)",
                              animation: "soul-copy-center-glow 2s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                          />
                        ) : null}

                        <div
                          className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/15 shadow-xl"
                          style={{
                            background: candidate
                              ? "linear-gradient(135deg, rgba(20,184,166,0.92) 0%, rgba(59,130,246,0.78) 100%)"
                              : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                            boxShadow: isHolding
                              ? "0 0 0 2px rgba(45,212,191,0.35), 0 12px 30px rgba(20,184,166,0.18)"
                              : undefined,
                          }}
                        >
                          {candidate ? (
                            <SoulAvatarIcon variant={avatarVariant} className="h-14 w-14" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 text-lg text-[var(--color-text-muted)]">
                              …
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative mb-4 h-28 w-28">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(rgba(20,184,166,0.9) ${Math.round(
                    holdProgress * 360,
                  )}deg, rgba(255,255,255,0.07) 0deg)`,
                  opacity: isPressing || holdProgress > 0 ? 0.95 : 0.55,
                }}
                aria-hidden="true"
              />
              <span
                className="absolute inset-[5px] rounded-full border border-[var(--color-border)] bg-[var(--color-navy-surface)]"
                aria-hidden="true"
              />
              <button
                type="button"
                disabled={isSubmittingPress || isMatchedOrSession}
                onPointerDown={(event) => {
                  event.preventDefault();
                  pushDebugEvent("button:onPointerDown", {
                    pointerId: event.pointerId,
                    isQueueReady,
                    isJoining,
                    isSubmittingPress,
                  });
                  if (!isQueueReady) {
                    void handleJoinQueueManual();
                    return;
                  }
                  void handlePressStart(event.pointerId);
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  pushDebugEvent("button:onPointerUp", { pointerId: event.pointerId });
                  void handlePressEnd(event.pointerId);
                }}
                onPointerCancel={(event) => {
                  event.preventDefault();
                  pushDebugEvent("button:onPointerCancel", { pointerId: event.pointerId });
                  void handlePressEnd(event.pointerId);
                }}
                onPointerLeave={(event) => {
                  if (!isPressing) return;
                  pushDebugEvent("button:onPointerLeave", { pointerId: event.pointerId });
                  void handlePressEnd(event.pointerId);
                }}
                className={`absolute inset-2 flex touch-none items-center justify-center rounded-full text-white shadow-2xl transition active:scale-95 disabled:opacity-70 ${
                  isPressing ? "translate-y-0.5" : ""
                }`}
                style={{
                  background: isPressing
                    ? "linear-gradient(135deg, rgba(20,184,166,0.95) 0%, rgba(45,212,191,0.95) 100%)"
                    : "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)",
                  boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3)",
                }}
                aria-label={`${soulGameActionCopy.pressToMatch} to Soul Game match`}
              >
                <Fingerprint className="h-12 w-12" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-center text-sm text-[rgba(45,212,191,0.7)]">
              {isPressing
                ? `Holding ${Math.round(holdProgress * 100)}% • keep holding`
                : `Hold target ${Math.ceil(soulGameTimingConfig.minHoldMs / 1000)}s • ${soulGamePrimaryActionLabel}`}
            </p>
            <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
              Press and hold center button to match
            </p>

            <div className="mt-6 w-full max-w-sm space-y-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-center text-xs text-[var(--color-text-secondary)]">
                {partnerPressLabel}
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-[11px] text-[var(--color-text-secondary)]">
                <span>Min overlap: {soulGameTimingConfig.minOverlapMs}ms</span>
                <span>Session: {soulGameTimingConfig.sessionDurationMs / 60000} min</span>
              </div>
            </div>
          </div>

          {isDevDebug ? (
            <details className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Debug (DEV)
              </summary>
              <div className="mt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Check browser console for `SoulGameDebug` logs.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDebugEvents([])}
                    className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-text-secondary)]"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 max-h-36 space-y-1 overflow-auto">
                  {debugEvents.length === 0 ? (
                    <p className="text-[11px] text-[var(--color-text-muted)]">No events yet.</p>
                  ) : (
                    debugEvents.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-white/5 bg-[var(--color-navy-surface)] px-2 py-1.5 text-[11px]"
                      >
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {row.at} • {row.event}
                        </p>
                        {row.detail ? (
                          <pre className="mt-1 overflow-x-auto text-[10px] leading-4 text-[var(--color-text-secondary)]">
{JSON.stringify(row.detail, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </details>
          ) : null}
        </main>
      </div>
    </div>
  );

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
                <p className="mt-1 text-base font-semibold">
                  {availableOpponentCount} online candidate{availableOpponentCount === 1 ? "" : "s"} in Soul Game
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {isClientStateLoading && !clientState
                    ? "Syncing queue..."
                    : availableOpponentCount > 0 && clientState?.queueSnapshot.estimatedWaitMs
                      ? `Estimated wait ~${Math.ceil((clientState?.queueSnapshot.estimatedWaitMs ?? 0) / 1000)}s`
                      : "Waiting for another player to hold (excludes you)"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  App online (sidebar presence): {appOnlineCount}
                  {appOnlineUsersError ? " • sidebar presence unavailable" : ""}
                </p>
                {isJoining && joinElapsedMs >= 5000 ? (
                  <p className="mt-1 text-xs text-[var(--color-rose)]">
                    Debug: joinQueue is still waiting ({Math.ceil(joinElapsedMs / 1000)}s)
                  </p>
                ) : null}
                {isQueueReady && availableOpponentCount === 0 ? (
                  <p className="mt-1 text-xs text-[var(--color-rose)]">
                    Queue sync looks delayed. Pull-to-refresh/reopen if this stays at 0.
                  </p>
                ) : null}
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
                    {highlightedCandidate?.username ? `@${highlightedCandidate?.username}` : "Waiting for players"}
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
                @{clientState?.session?.matchedUser.username ?? "friend"} eyy to you, beginning your 2-minute conversation session
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
              <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-center text-xs text-[var(--color-text-secondary)]">
                {partnerPressLabel}
              </div>
              <div className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-center text-xs text-[var(--color-text-secondary)]">
                Press and hold anywhere inside the big button. Start on the thumbprint in the center.
              </div>

              <div className="flex justify-center">
                <div className="relative h-48 w-48">
                  <span
                    className={`absolute inset-0 translate-y-2 rounded-full border border-[var(--color-border)] ${
                      isPressing
                        ? "bg-[var(--color-navy-elevated)]"
                        : "bg-[color:rgba(255,255,255,0.03)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute inset-2 rounded-full opacity-80"
                    style={{
                      background: `conic-gradient(rgba(20,184,166,0.9) ${Math.round(holdProgress * 360)}deg, rgba(255,255,255,0.06) 0deg)`,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute inset-5 rounded-full border border-[var(--color-border)] bg-[var(--color-navy-bg)]"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingPress || isMatchedOrSession}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    pushDebugEvent("button:onPointerDown", {
                      pointerId: event.pointerId,
                      isQueueReady,
                      isJoining,
                      isSubmittingPress,
                    });
                    if (!isQueueReady) {
                      void handleJoinQueueManual();
                      return;
                      }
                      void handlePressStart(event.pointerId);
                    }}
                  onPointerUp={(event) => {
                    event.preventDefault();
                    pushDebugEvent("button:onPointerUp", { pointerId: event.pointerId });
                    void handlePressEnd(event.pointerId);
                  }}
                  onPointerCancel={(event) => {
                    event.preventDefault();
                    pushDebugEvent("button:onPointerCancel", { pointerId: event.pointerId });
                    void handlePressEnd(event.pointerId);
                  }}
                  onPointerLeave={(event) => {
                    if (!isPressing) return;
                    pushDebugEvent("button:onPointerLeave", { pointerId: event.pointerId });
                    void handlePressEnd(event.pointerId);
                  }}
                    className={`group absolute inset-0 touch-none rounded-full border text-center transition duration-75 motion-reduce:transition-none disabled:opacity-70 ${
                      isPressing
                        ? "translate-y-2 border-[var(--color-rose)]/50 bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(20,184,166,0.07))]"
                        : isMatchedOrSession
                          ? "border-[var(--color-rose)] bg-[linear-gradient(180deg,rgba(20,184,166,0.18),rgba(20,184,166,0.10))]"
                          : "border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]"
                    }`}
                    aria-label={`${soulGameActionCopy.pressToMatch} to Soul Game match`}
                  >
                    <span className="absolute inset-3 rounded-full border border-white/8" aria-hidden="true" />
                    <span className="absolute inset-8 rounded-full border border-dashed border-[var(--color-rose)]/30" aria-hidden="true" />
                    <span
                      className={`absolute inset-0 rounded-full transition motion-reduce:transition-none ${
                        isMatchedOrSession
                          ? "animate-pulse bg-[radial-gradient(circle,rgba(20,184,166,0.20)_0%,rgba(20,184,166,0)_65%)]"
                          : isPressing
                            ? "bg-[radial-gradient(circle,rgba(20,184,166,0.14)_0%,rgba(20,184,166,0)_72%)]"
                            : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1.5 px-4">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
                          isPressing
                            ? "border-[var(--color-rose)]/60 bg-[var(--color-rose)]/10"
                            : "border-[var(--color-rose)]/35 bg-[var(--color-navy-surface)]/60"
                        }`}
                      >
                        <Fingerprint className="h-6 w-6 text-[var(--color-rose)]" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        {isPressing ? `Holding ${Math.round(holdProgress * 100)}%` : "Press Here"}
                      </span>
                      <span className={`text-sm font-semibold leading-4 ${isPressing ? "text-[var(--color-rose)]" : ""}`}>
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
                      <span className="text-[11px] text-[var(--color-text-secondary)]">
                        Test hold target: {Math.ceil(soulGameTimingConfig.minHoldMs / 1000)}s
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-2">
                  Hold {" >="} {soulGameTimingConfig.minHoldMs}ms (test)
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-2">
                  Session = {soulGameTimingConfig.sessionDurationMs / 60000} min
                </div>
              </div>

              {isDevDebug ? (
                <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Debug (DEV)
                    </p>
                    <button
                      type="button"
                      onClick={() => setDebugEvents([])}
                      className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-text-secondary)]"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    Check browser console for `SoulGameDebug` logs. Latest entries shown below.
                  </p>
                  <div className="mt-2 max-h-40 space-y-1 overflow-auto">
                    {debugEvents.length === 0 ? (
                      <p className="text-[11px] text-[var(--color-text-muted)]">No events yet.</p>
                    ) : (
                      debugEvents.map((row) => (
                        <div
                          key={row.id}
                          className="rounded-lg border border-white/5 bg-[var(--color-navy-surface)] px-2 py-1.5 text-[11px]"
                        >
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {row.at} • {row.event}
                          </p>
                          {row.detail ? (
                            <pre className="mt-1 overflow-x-auto text-[10px] leading-4 text-[var(--color-text-secondary)]">
{JSON.stringify(row.detail, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default SoulGameRoute;
