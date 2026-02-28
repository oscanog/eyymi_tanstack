import { Navigate, createFileRoute } from "@tanstack/react-router";
import { Fingerprint } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SoulAvatarIcon,
  SoulGameIcon,
  getSoulAvatarVariantByIndex,
  resolveSoulAvatarVariant,
} from "@/components/icons";
import { StatusModal } from "@/components/ui/StatusModal";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useConvexSubscription, usePresenceHeartbeat } from "@/hooks";
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
  reused?: boolean;
  isReady?: boolean;
  serverNow: number;
};

type PressCommitResult = {
  ok: boolean;
  matched: boolean;
  matchId?: string | null;
  reason?: string;
  durationMs?: number;
  serverNow: number;
};

type PressCancelResult = {
  ok: boolean;
  preserved?: boolean;
  reason?: string;
  serverNow: number;
};

type CloseDemoMatchResult = {
  ok: boolean;
  reason?: string;
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
  focusWindow: {
    id: string;
    startsAt: number;
    endsAt: number;
    durationMs: number;
  } | null;
  focusTarget: {
    queueEntryId: string;
    username?: string | null;
    avatarId?: string | null;
  } | null;
  selfHold: {
    pressEventId: string;
    progressMs: number;
    progressRatio: number;
    isReady: boolean;
  } | null;
  partnerReciprocalHold: {
    queueEntryId: string;
    progressMs: number;
    progressRatio: number;
    isReady: boolean;
    isVisible: boolean;
  } | null;
  demoMatch: {
    matchId: string;
    status: "pending_intro" | "ended";
    matchedUser: {
      queueEntryId?: string | null;
      username?: string | null;
      avatarId?: string | null;
    };
    windowId: string;
  } | null;
};

export const Route = createFileRoute("/soul_game")({
  component: SoulGameRoute,
});

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

function formatWindowCountdown(ms: number) {
  return `${Math.max(0, ms / 1000).toFixed(1)}s left`;
}

function RingTrack({
  progress,
  color,
  inset,
  reverse = false,
  glow = false,
}: {
  progress: number;
  color: string;
  inset: number;
  reverse?: boolean;
  glow?: boolean;
}) {
  const angle = Math.max(0, Math.min(1, progress)) * 360;
  return (
    <div
      className="absolute rounded-full"
      style={{
        inset,
        padding: 6,
        background: "rgba(255,255,255,0.06)",
        boxShadow: glow ? `0 0 24px ${color}55` : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`,
          transform: reverse ? "scaleX(-1)" : undefined,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: 6,
          background: "var(--color-navy-bg)",
        }}
      />
    </div>
  );
}

function SoulGameRoute() {
  usePresenceHeartbeat();

  const [isHydrated, setIsHydrated] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [localPressEventId, setLocalPressEventId] = useState<string | null>(null);
  const [pressStartedAtMs, setPressStartedAtMs] = useState<number | null>(null);
  const [isLocallyReady, setIsLocallyReady] = useState(false);
  const [localUiState, setLocalUiState] = useState<SoulGameUiStateKey>("idle");
  const [inlineErrorCode, setInlineErrorCode] = useState<
    "QUEUE_JOIN_FAILED" | "QUEUE_HEARTBEAT_FAILED" | "PRESS_START_FAILED" | "PRESS_END_FAILED" | "MATCH_SYNC_FAILED" | "UNKNOWN" | null
  >(null);

  const lastFocusWindowIdRef = useRef<string | null>(null);
  const committingPressRef = useRef(false);
  const closingMatchRef = useRef(false);
  const lastLocalAvatarId = soulGameAvatarCatalog[0]?.id ?? "soul-ava-01";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 100);
    return () => window.clearInterval(intervalId);
  }, []);

  const hasOtpAuth = isHydrated ? otpAuthStorage.hasValidSession() : true;
  const otpSession = isHydrated ? otpAuthStorage.getSession() : null;
  const username = isHydrated ? storage.getUsername() ?? "you" : "you";
  const profileUserId = isHydrated ? storage.getUserId() ?? undefined : undefined;

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
    setLocalUiState("error");
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
    }, { maxRetries: 0 })
      .then((result) => {
        if (cancelled) return;
        setQueueEntryId(result.queueEntryId);
      })
      .catch(() => {
        if (cancelled) return;
        setAutoJoinEnabled(false);
        setInlineErrorCode("QUEUE_JOIN_FAILED");
        setLocalUiState("error");
      })
      .finally(() => {
        if (!cancelled) {
          setIsJoining(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [autoJoinEnabled, hasOtpAuth, isJoining, lastLocalAvatarId, otpSession, profileUserId, queueEntryId, username]);

  useEffect(() => {
    if (!queueEntryId) return;

    const sendHeartbeat = async () => {
      try {
        await convexMutation("soulGamePresence:heartbeat", { queueEntryId });
      } catch {
        setInlineErrorCode((previous) => previous ?? "QUEUE_HEARTBEAT_FAILED");
      }
    };

    void sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, soulGameTimingConfig.queueHeartbeatMs);
    return () => window.clearInterval(intervalId);
  }, [queueEntryId]);

  useEffect(() => {
    return () => {
      if (!queueEntryId) return;
      void convexMutation("soulGamePresence:leaveQueue", { queueEntryId }).catch(() => {});
    };
  }, [queueEntryId]);

  useEffect(() => {
    const nextWindowId = clientState?.focusWindow?.id ?? null;
    if (!nextWindowId || lastFocusWindowIdRef.current === nextWindowId) return;

    lastFocusWindowIdRef.current = nextWindowId;
    setIsPressing(false);
    setIsLocallyReady(false);
    setLocalPressEventId(null);
    setPressStartedAtMs(null);
  }, [clientState?.focusWindow?.id]);

  useEffect(() => {
    if (clientState?.demoMatch?.status === "pending_intro") {
      setIsPressing(false);
      setIsLocallyReady(false);
      setLocalPressEventId(null);
      setPressStartedAtMs(null);
      return;
    }

    if (clientState?.selfHold?.isReady) {
      setIsLocallyReady(true);
    }
  }, [clientState?.demoMatch?.status, clientState?.selfHold?.isReady]);

  useEffect(() => {
    if (clientState?.demoMatch?.status === "pending_intro") {
      setLocalUiState("matched");
      return;
    }
    if (inlineErrorCode) {
      setLocalUiState("error");
      return;
    }
    if (isPressing) {
      setLocalUiState("pressing");
      return;
    }
    if (clientState?.queueSnapshot.self) {
      setLocalUiState("queueing");
      return;
    }
    setLocalUiState("idle");
  }, [clientState?.demoMatch?.status, clientState?.queueSnapshot.self, inlineErrorCode, isPressing]);

  useEffect(() => {
    if (
      !isPressing ||
      isLocallyReady ||
      !queueEntryId ||
      !localPressEventId ||
      !pressStartedAtMs ||
      !clientState?.focusWindow ||
      !clientState?.focusTarget ||
      clientState.demoMatch?.status === "pending_intro"
    ) {
      return;
    }

    const elapsed = nowTick - pressStartedAtMs;
    const remaining = soulGameTimingConfig.minHoldMs - elapsed;
    if (remaining > 0) {
      return;
    }
    if (committingPressRef.current) {
      return;
    }

    committingPressRef.current = true;
    void convexMutation<PressCommitResult>("soulGameMatch:pressCommit", {
      queueEntryId,
      pressEventId: localPressEventId,
      targetQueueEntryId: clientState.focusTarget.queueEntryId,
      focusWindowId: clientState.focusWindow.id,
    }, { maxRetries: 0 })
      .then((result) => {
        if (!result.ok) {
          setInlineErrorCode("PRESS_END_FAILED");
          return;
        }
        if (result.reason === "min_hold") {
          return;
        }
        setIsLocallyReady(true);
      })
      .catch(() => {
        setInlineErrorCode("PRESS_END_FAILED");
      })
      .finally(() => {
        committingPressRef.current = false;
      });
  }, [
    clientState?.demoMatch?.status,
    clientState?.focusTarget,
    clientState?.focusWindow,
    isLocallyReady,
    isPressing,
    localPressEventId,
    nowTick,
    pressStartedAtMs,
    queueEntryId,
  ]);

  if (isHydrated && !hasOtpAuth) {
    return <Navigate to="/signin" replace />;
  }

  const inlineMessage = inlineErrorCode
    ? mapSoulGameErrorToInlineMessage(inlineErrorCode)
    : getSoulGameInlineMessageForState(localUiState);

  const centerCandidate = clientState?.focusTarget ?? null;
  const otherCandidates = (clientState?.queueSnapshot.onlineCandidates ?? []).filter(
    (candidate) => candidate.queueEntryId !== centerCandidate?.queueEntryId,
  );
  const carouselCandidates = [
    otherCandidates[0] ?? null,
    otherCandidates[1] ?? null,
    centerCandidate,
    otherCandidates[2] ?? null,
    otherCandidates[3] ?? null,
  ];

  const localProgressRatio = isPressing && pressStartedAtMs
    ? Math.min(1, Math.max(0, (nowTick - pressStartedAtMs) / soulGameTimingConfig.minHoldMs))
    : 0;
  const selfProgressRatio = Math.max(
    clientState?.selfHold?.progressRatio ?? 0,
    localProgressRatio,
    isLocallyReady ? 1 : 0,
  );
  const selfReady = Boolean(clientState?.selfHold?.isReady || isLocallyReady);
  const partnerRingVisible = Boolean(clientState?.partnerReciprocalHold?.isVisible);
  const partnerProgressRatio = partnerRingVisible
    ? clientState?.partnerReciprocalHold?.progressRatio ?? 0
    : 0;
  const chanceCountdownMs = clientState?.focusWindow
    ? clientState.focusWindow.endsAt - (clientState.serverNow + (nowTick - clientState.serverNow))
    : 0;
  const chanceLabel = clientState?.focusWindow ? formatWindowCountdown(chanceCountdownMs) : "Waiting";
  const isQueueReady = Boolean(queueEntryId && clientState?.queueSnapshot.self);
  const isMatchOpen = clientState?.demoMatch?.status === "pending_intro";
  const centerAvatarVariant = getBoundSoulAvatarVariant(
    centerCandidate?.avatarId,
    centerCandidate?.queueEntryId ?? centerCandidate?.username,
    2,
  );

  const handleLeaveQueue = async () => {
    if (!queueEntryId) return;
    await convexMutation("soulGamePresence:leaveQueue", { queueEntryId }).catch(() => {});
    setAutoJoinEnabled(false);
    setQueueEntryId(null);
    setIsPressing(false);
    setIsLocallyReady(false);
    setLocalPressEventId(null);
    setPressStartedAtMs(null);
  };

  const handleStartPress = async (pointerId: number) => {
    if (pointerId < 0) return;
    if (!queueEntryId || !clientState?.focusTarget || !clientState.focusWindow || isMutating || isMatchOpen) {
      return;
    }

    setInlineErrorCode(null);
    setIsMutating(true);

    try {
      const result = await convexMutation<PressStartResult>("soulGameMatch:pressStart", {
        queueEntryId,
        targetQueueEntryId: clientState.focusTarget.queueEntryId,
        focusWindowId: clientState.focusWindow.id,
      }, { maxRetries: 0 });

      if (!result.ok || !result.pressEventId) {
        setInlineErrorCode("PRESS_START_FAILED");
        return;
      }

      setLocalPressEventId(result.pressEventId);
      setPressStartedAtMs(Date.now());
      setIsLocallyReady(Boolean(result.isReady));
      setIsPressing(true);
    } catch {
      setInlineErrorCode("PRESS_START_FAILED");
    } finally {
      setIsMutating(false);
    }
  };

  const handleEndPress = async () => {
    setIsPressing(false);

    if (!queueEntryId || !localPressEventId || isLocallyReady) {
      return;
    }

    try {
      await convexMutation<PressCancelResult>("soulGameMatch:pressCancel", {
        queueEntryId,
        pressEventId: localPressEventId,
      }, { maxRetries: 0 });
    } catch {
      setInlineErrorCode("PRESS_END_FAILED");
    } finally {
      setLocalPressEventId(null);
      setPressStartedAtMs(null);
    }
  };

  const handleCloseMatch = async () => {
    if (!queueEntryId || !clientState?.demoMatch?.matchId || closingMatchRef.current) {
      return;
    }
    closingMatchRef.current = true;
    try {
      await convexMutation<CloseDemoMatchResult>("soulGameMatch:closeDemoMatch", {
        queueEntryId,
        matchId: clientState.demoMatch.matchId,
      }, { maxRetries: 0 });
    } finally {
      closingMatchRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <StatusModal
        isOpen={isMatchOpen}
        tone="success"
        title="eyymi match happened"
        message={`${
          clientState?.demoMatch?.matchedUser.username
            ? `@${clientState.demoMatch.matchedUser.username}`
            : "Your center match"
        } pressed you back. Close this when you want the carousel to continue.`}
        confirmLabel="Close"
        onClose={() => {
          void handleCloseMatch();
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-4 pb-6">
        <header className="safe-area-inset">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 text-sm font-medium"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <SoulGameIcon className="h-8 w-8" />
              <h1 className="text-lg font-semibold tracking-tight">Soul game</h1>
            </div>
            <button
              type="button"
              onClick={() => void handleLeaveQueue()}
              disabled={!queueEntryId}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 text-xs font-medium disabled:opacity-50"
            >
              {soulGameActionCopy.leaveQueue}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="mt-5">
            <StatusMessage
              tone={inlineMessage.tone === "success" ? "success" : inlineMessage.tone === "error" ? "error" : "info"}
              title={inlineMessage.title}
              message={inlineMessage.description}
            />
          </section>

          <section className="mt-6 rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(4,10,26,0.96),rgba(5,14,30,0.82))] px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  Matching
                </p>
                <h2 className="mt-2 text-[56px] font-semibold leading-none text-[var(--color-teal)]">
                  Matching
                </h2>
                <p className="mt-2 text-base text-[var(--color-text-secondary)]">
                  Online now {clientState?.queueSnapshot.queueCount ?? 0}. Hold to start a quick match.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                @{username}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <span className="rounded-full border border-[rgba(20,184,166,0.25)] bg-[rgba(20,184,166,0.12)] px-4 py-1.5 text-sm font-medium text-[var(--color-teal)]">
                {centerCandidate ? chanceLabel : "Waiting for players"}
              </span>
            </div>

            <div className="relative mt-8 h-[390px]">
              {carouselCandidates.map((candidate, index) => {
                const offsetMap = [
                  { left: "4%", top: "49%", size: "78px", blur: "blur-[1px]" },
                  { left: "23%", top: "34%", size: "94px", blur: "blur-[0.5px]" },
                  { left: "50%", top: "44%", size: "212px", blur: "" },
                  { left: "77%", top: "34%", size: "94px", blur: "blur-[0.5px]" },
                  { left: "96%", top: "49%", size: "78px", blur: "blur-[1px]" },
                ][index]!;
                const isCenter = index === 2;
                const avatarVariant = getBoundSoulAvatarVariant(
                  candidate?.avatarId,
                  candidate?.queueEntryId ?? candidate?.username,
                  index,
                );

                return (
                  <div
                    key={candidate?.queueEntryId ?? `slot-${index}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 ${offsetMap.blur}`}
                    style={{ left: offsetMap.left, top: offsetMap.top }}
                  >
                    {isCenter ? (
                      <div className="relative flex h-[240px] w-[240px] items-center justify-center">
                        <RingTrack progress={selfProgressRatio} color="#2dd4bf" inset={0} glow={selfProgressRatio > 0} />
                        {partnerRingVisible ? (
                          <RingTrack progress={partnerProgressRatio} color="#fb7185" inset={16} reverse glow />
                        ) : (
                          <div
                            className="absolute rounded-full border border-dashed border-white/10"
                            style={{ inset: 16 }}
                            aria-hidden="true"
                          />
                        )}
                        <div
                          className="absolute rounded-full border border-white/15 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.24),rgba(45,212,191,0.08)_58%,rgba(4,10,26,0.94)_100%)] shadow-[0_0_34px_rgba(45,212,191,0.24)]"
                          style={{ inset: 32 }}
                        />
                        <div className="relative rounded-full border border-white/20 p-2">
                          <SoulAvatarIcon variant={centerAvatarVariant} className="h-[156px] w-[156px]" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-full border border-white/10 bg-[rgba(45,212,191,0.14)] shadow-[0_0_26px_rgba(45,212,191,0.18)]"
                        style={{ width: offsetMap.size, height: offsetMap.size }}
                      >
                        <SoulAvatarIcon variant={avatarVariant} className="h-full w-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {centerCandidate?.username ? `@${centerCandidate.username}` : "Waiting for players"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {partnerRingVisible
                  ? "They are pressing you back. Finish your 1.5s ring before this 3-second chance ends."
                  : "Your ring fills clockwise. Their ring appears only if they target you back in this same window."}
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-[var(--color-border)] bg-[rgba(6,14,30,0.86)] p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-[var(--color-text-secondary)]">
              <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                Queue {clientState?.queueSnapshot.queueCount ?? 0}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                Hold 1.5s
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                Chance 3.0s
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={isMutating || isMatchOpen}
                onPointerDown={(event) => {
                  event.preventDefault();
                  if (!isQueueReady) {
                    setAutoJoinEnabled(true);
                    return;
                  }
                  void handleStartPress(event.pointerId);
                }}
                onPointerUp={(event) => {
                  event.preventDefault();
                  void handleEndPress();
                }}
                onPointerCancel={(event) => {
                  event.preventDefault();
                  void handleEndPress();
                }}
                onPointerLeave={(event) => {
                  if (!isPressing) return;
                  event.preventDefault();
                  void handleEndPress();
                }}
                className={`relative flex h-[168px] w-[168px] touch-none items-center justify-center rounded-full border transition duration-150 motion-reduce:transition-none ${
                  isPressing || selfReady
                    ? "border-[rgba(45,212,191,0.55)] bg-[radial-gradient(circle,rgba(45,212,191,0.3),rgba(45,212,191,0.12)_58%,rgba(45,212,191,0.04)_100%)] shadow-[0_0_32px_rgba(45,212,191,0.24)]"
                    : "border-white/10 bg-[radial-gradient(circle,rgba(45,212,191,0.16),rgba(45,212,191,0.04)_60%,rgba(45,212,191,0.02)_100%)]"
                }`}
                aria-label={`${soulGameActionCopy.pressToMatch} in Soul Game`}
              >
                <div className="absolute inset-3 rounded-full border border-white/10" aria-hidden="true" />
                <div className="absolute inset-7 rounded-full border border-dashed border-white/10" aria-hidden="true" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Fingerprint className="h-12 w-12 text-white" aria-hidden="true" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {selfReady ? "Ready 100%" : isPressing ? `${Math.round(selfProgressRatio * 100)}%` : "Fingerprint"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {isQueueReady
                      ? selfReady
                        ? "Waiting for them"
                        : soulGameActionCopy.pressToMatch
                      : isJoining
                        ? "Joining queue..."
                        : soulGameActionCopy.joinQueue}
                  </span>
                </div>
              </button>
            </div>

            {!isQueueReady ? (
              <button
                type="button"
                disabled={isJoining || isClientStateLoading}
                onClick={() => {
                  if (!hasOtpAuth || !otpSession) return;
                  setInlineErrorCode(null);
                  setAutoJoinEnabled(true);
                }}
                className="mt-4 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {isJoining ? "Joining queue..." : soulGameActionCopy.joinQueue}
              </button>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

export default SoulGameRoute;
