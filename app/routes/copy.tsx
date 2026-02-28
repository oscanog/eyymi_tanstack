import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Fingerprint, Heart, SlidersHorizontal, X } from "lucide-react";
import { convexMutation } from "@/lib/convex";
import { useConvexQuery, useConvexSubscription } from "@/hooks/useConvexQuery";
import { shouldShowNoCandidatesDecision } from "@/lib/copy-match.helpers";
import { resolveCopyCarouselAvatar } from "@/lib/copy-online-users";
import { storage } from "@/lib/storage";
import {
  GenderFemaleIcon,
  GenderGayIcon,
  GenderLesbianIcon,
  GenderMaleIcon,
} from "@/components/icons";
import { onboardingGenderOptions, type GenderOption } from "../../data";

export const Route = createFileRoute("/copy")({
  validateSearch: (search: Record<string, unknown>) => ({
    e2e: typeof search.e2e === "string" ? search.e2e : undefined,
    debug: search.debug === "shots" ? "shots" : undefined,
  }),
  component: CopyMatchPage,
});

type UserProfile = {
  _id: string;
  username: string;
  avatarId?: string;
  gender?: GenderOption;
  preferredMatchGender?: GenderOption;
};

type JoinQueueResult = {
  queueEntryId: string;
  status: "queued" | "matched";
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

type CloseMatchResult = {
  ok: boolean;
  reason?: string;
  serverNow: number;
};

type CopyClientState = {
  serverNow: number;
  config: {
    MIN_HOLD_MS: number;
    FOCUS_WINDOW_MS: number;
    QUEUE_HEARTBEAT_MS: number;
    RING_PROGRESS_MS: number;
  };
  filterMode: "preferred_only" | "all_genders";
  self: {
    queueEntryId: string;
    username: string | null;
    avatarId: string | null;
    gender: GenderOption | null;
    preferredMatchGender: GenderOption | null;
    queueStatus: "queued" | "matching" | "matched";
    targetQueueEntryId: string | null;
  } | null;
  candidates: Array<{
    queueEntryId: string;
    username: string | null;
    avatarId: string | null;
    gender: GenderOption | null;
    joinedAt: number;
    lastHeartbeatAt: number;
  }>;
  hasCandidatesForPreferred: boolean;
  focusWindow: {
    id: string;
    startsAt: number;
    endsAt: number;
    durationMs: number;
  } | null;
  focusTarget: {
    queueEntryId: string;
    username: string | null;
    avatarId: string | null;
    gender: GenderOption | null;
  } | null;
  selfHold: {
    pressEventId: string;
    progressMs: number;
    progressRatio: number;
    isReady: boolean;
    isVisible: boolean;
  } | null;
  partnerReciprocalHold: {
    queueEntryId: string;
    progressMs: number;
    progressRatio: number;
    isReady: boolean;
    isVisible: boolean;
  } | null;
  activeMatch: {
    matchId: string;
    status: "success_open";
    matchedUser: {
      queueEntryId: string | null;
      username: string | null;
      avatarId: string | null;
    };
    windowId: string;
  } | null;
};

const genderOptionIcons: Record<GenderOption, ComponentType<{ className?: string }>> = {
  male: GenderMaleIcon,
  female: GenderFemaleIcon,
  gay: GenderGayIcon,
  lesbian: GenderLesbianIcon,
};

function RingTrack({
  testId,
  progress,
  color,
  inset,
  direction,
  visible,
}: {
  testId: string;
  progress: number;
  color: string;
  inset: number;
  direction: "clockwise" | "counter-clockwise";
  visible: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const angle = clamped * 360;

  return (
    <div
      data-testid={testId}
      data-visible={visible ? "true" : "false"}
      data-direction={direction}
      data-progress-percent={String(Math.round(clamped * 100))}
      aria-label={`${direction} ring ${Math.round(clamped * 100)} percent`}
      className="absolute rounded-full transition-opacity duration-150"
      style={{
        inset,
        opacity: visible ? 1 : 0,
        padding: 6,
        background: "rgba(255,255,255,0.06)",
        boxShadow: visible ? `0 0 24px ${color}55` : undefined,
      }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`,
          transform: direction === "counter-clockwise" ? "scaleX(-1)" : undefined,
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

function CopyMatchPage() {
  const search = Route.useSearch();
  const userId = storage.getUserId();
  const scopeKey = search.e2e?.trim() || undefined;
  const isDebugShots = search.debug === "shots";
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"preferred_only" | "all_genders">("preferred_only");
  const [activePressEventId, setActivePressEventId] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [isLocallyReady, setIsLocallyReady] = useState(false);
  const [pressStartedAtMs, setPressStartedAtMs] = useState<number | null>(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showNoCandidatesModal, setShowNoCandidatesModal] = useState(false);
  const [selectedPreferredGender, setSelectedPreferredGender] = useState<GenderOption | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  const lastFocusWindowIdRef = useRef<string | null>(null);
  const committingPressRef = useRef(false);
  const closingMatchRef = useRef(false);

  const { data: profile } = useConvexQuery<UserProfile>(
    "users:get",
    userId ? { userId } : {},
    Boolean(userId),
  );

  const { data: state } = useConvexSubscription<CopyClientState>(
    "copyMatch:getClientState",
    queueEntryId ? { queueEntryId, filterMode, scopeKey } : { filterMode, scopeKey },
    250,
    true,
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setSelectedPreferredGender(profile.preferredMatchGender ?? null);
    setShowPreferenceModal(!profile.preferredMatchGender);
  }, [profile]);

  useEffect(() => {
    if (!profile || !profile.preferredMatchGender || queueEntryId) return;
    let cancelled = false;
    void convexMutation<JoinQueueResult>("copyMatch:joinQueue", {
      profileUserId: profile._id,
      username: profile.username,
      avatarId: profile.avatarId,
      gender: profile.gender,
      preferredMatchGender: profile.preferredMatchGender,
      scopeKey,
    }).then((result) => {
      if (!cancelled) setQueueEntryId(result.queueEntryId);
    });
    return () => {
      cancelled = true;
    };
  }, [profile, queueEntryId, scopeKey]);

  useEffect(() => {
    if (!queueEntryId) return;
    const interval = window.setInterval(() => {
      void convexMutation("copyMatch:heartbeat", { queueEntryId });
    }, state?.config.QUEUE_HEARTBEAT_MS ?? 15000);
    return () => window.clearInterval(interval);
  }, [queueEntryId, state?.config.QUEUE_HEARTBEAT_MS]);

  useEffect(() => {
    if (!state?.self) return;
    const shouldShow = shouldShowNoCandidatesDecision({
      hasPreferredGender: Boolean(state.self.preferredMatchGender),
      hasCandidatesForPreferred: state.hasCandidatesForPreferred,
      filterMode,
    });
    setShowNoCandidatesModal(shouldShow && !showPreferenceModal);
  }, [state?.self, state?.hasCandidatesForPreferred, filterMode, showPreferenceModal]);

  useEffect(() => {
    return () => {
      if (!queueEntryId) return;
      void convexMutation("copyMatch:leaveQueue", { queueEntryId });
    };
  }, [queueEntryId]);

  useEffect(() => {
    const nextWindowId = state?.focusWindow?.id ?? null;
    if (!nextWindowId || lastFocusWindowIdRef.current === nextWindowId) return;

    lastFocusWindowIdRef.current = nextWindowId;
    setIsPressing(false);
    setIsLocallyReady(false);
    setActivePressEventId(null);
    setPressStartedAtMs(null);
  }, [state?.focusWindow?.id]);

  useEffect(() => {
    if (state?.activeMatch?.status === "success_open") {
      setIsPressing(false);
      setIsLocallyReady(false);
      setActivePressEventId(null);
      setPressStartedAtMs(null);
      return;
    }

    if (state?.selfHold?.isReady) {
      setIsLocallyReady(true);
    }
  }, [state?.activeMatch?.status, state?.selfHold?.isReady]);

  useEffect(() => {
    if (
      !isPressing ||
      isLocallyReady ||
      !queueEntryId ||
      !activePressEventId ||
      !pressStartedAtMs ||
      !state?.focusWindow ||
      !state?.focusTarget ||
      state.activeMatch?.status === "success_open"
    ) {
      return;
    }

    const elapsed = nowMs - pressStartedAtMs;
    const remaining = (state.config.MIN_HOLD_MS ?? 1500) - elapsed;
    if (remaining > 0 || committingPressRef.current) {
      return;
    }

    committingPressRef.current = true;
    void convexMutation<PressCommitResult>("copyMatch:pressCommit", {
      queueEntryId,
      pressEventId: activePressEventId,
      targetQueueEntryId: state.focusTarget.queueEntryId,
      focusWindowId: state.focusWindow.id,
      filterMode,
    })
      .then((result) => {
        if (!result.ok) return;
        if (result.reason === "min_hold") return;
        setIsLocallyReady(true);
      })
      .finally(() => {
        committingPressRef.current = false;
      });
  }, [
    activePressEventId,
    filterMode,
    isLocallyReady,
    isPressing,
    nowMs,
    pressStartedAtMs,
    queueEntryId,
    state,
  ]);

  const handleSavePreference = async () => {
    if (!selectedPreferredGender || !userId) return;
    setIsSavingPreference(true);
    try {
      await convexMutation("users:updateMatchPreference", {
        userId,
        preferredMatchGender: selectedPreferredGender,
      });

      if (profile) {
        const result = await convexMutation<JoinQueueResult>("copyMatch:joinQueue", {
          profileUserId: profile._id,
          username: profile.username,
          avatarId: profile.avatarId,
          gender: profile.gender,
          preferredMatchGender: selectedPreferredGender,
          scopeKey,
        });
        setQueueEntryId(result.queueEntryId);
      }

      setShowPreferenceModal(false);
      setFilterMode("preferred_only");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleStartPress = async () => {
    if (!queueEntryId || !state?.focusTarget || !state.focusWindow || state.activeMatch?.status === "success_open") {
      return;
    }

    const result = await convexMutation<PressStartResult>("copyMatch:pressStart", {
      queueEntryId,
      targetQueueEntryId: state.focusTarget.queueEntryId,
      focusWindowId: state.focusWindow.id,
      filterMode,
    });
    if (!result.ok || !result.pressEventId) return;

    setActivePressEventId(result.pressEventId);
    setPressStartedAtMs(Date.now());
    setIsLocallyReady(Boolean(result.isReady));
    setIsPressing(true);
  };

  const handleEndPress = async () => {
    setIsPressing(false);

    if (!queueEntryId || !activePressEventId || isLocallyReady) {
      return;
    }

    try {
      const result = await convexMutation<PressCancelResult>("copyMatch:pressCancel", {
        queueEntryId,
        pressEventId: activePressEventId,
      });
      if (!result.preserved) {
        setActivePressEventId(null);
        setPressStartedAtMs(null);
      }
    } finally {
      if (!isLocallyReady) {
        setActivePressEventId(null);
        setPressStartedAtMs(null);
      }
    }
  };

  const handleCloseMatch = async () => {
    if (!queueEntryId || !state?.activeMatch?.matchId || closingMatchRef.current) {
      return;
    }
    closingMatchRef.current = true;
    try {
      await convexMutation<CloseMatchResult>("copyMatch:closeMatch", {
        queueEntryId,
        matchId: state.activeMatch.matchId,
      });
    } finally {
      closingMatchRef.current = false;
    }
  };

  const carouselCandidates = useMemo(() => {
    const centerCandidate = state?.focusTarget ?? null;
    const otherCandidates = (state?.candidates ?? []).filter(
      (candidate) => candidate.queueEntryId !== centerCandidate?.queueEntryId,
    );
    return [
      otherCandidates[0] ?? null,
      otherCandidates[1] ?? null,
      centerCandidate,
      otherCandidates[2] ?? null,
      otherCandidates[3] ?? null,
    ];
  }, [state?.candidates, state?.focusTarget]);

  const localProgressRatio = isPressing && pressStartedAtMs && state?.config.MIN_HOLD_MS
    ? Math.min(1, Math.max(0, (nowMs - pressStartedAtMs) / state.config.MIN_HOLD_MS))
    : 0;
  const selfProgressRatio = Math.max(
    state?.selfHold?.progressRatio ?? 0,
    localProgressRatio,
    isLocallyReady ? 1 : 0,
  );
  const isMatchOpen = state?.activeMatch?.status === "success_open";
  const showSelfRing = isPressing && !isMatchOpen && Boolean(state?.focusTarget);
  const partnerRingVisible = Boolean(state?.partnerReciprocalHold?.isVisible) && !isMatchOpen;
  const partnerProgressRatio = partnerRingVisible ? state?.partnerReciprocalHold?.progressRatio ?? 0 : 0;
  const estimatedServerNow = state?.serverNow ? state.serverNow + (nowMs - state.serverNow) : nowMs;
  const countdownMs = state?.focusWindow ? Math.max(0, state.focusWindow.endsAt - estimatedServerNow) : 0;
  const countdownValue = state?.focusTarget
    ? String(Math.min(3, Math.max(1, Math.ceil(countdownMs / 1000))))
    : "0";
  const centerQueueSuffix = state?.self?.queueEntryId ? state.self.queueEntryId.slice(-6) : "none";

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      {isDebugShots ? (
        <div
          data-testid="copy-debug-overlay"
          className="fixed top-3 right-3 z-[90] rounded-2xl border border-white/10 bg-[rgba(4,10,26,0.92)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-secondary)] shadow-xl backdrop-blur"
        >
          <div>window: {state?.focusWindow?.id ?? "none"}</div>
          <div>remaining_ms: {Math.floor(countdownMs)}</div>
          <div>center: {state?.focusTarget?.username ?? "none"}</div>
          <div>self_ring: {showSelfRing ? "visible" : "hidden"} / {Math.round(selfProgressRatio * 100)}%</div>
          <div>partner_ring: {partnerRingVisible ? "visible" : "hidden"} / {Math.round(partnerProgressRatio * 100)}%</div>
          <div>queue_suffix: {centerQueueSuffix}</div>
          <div>match: {state?.activeMatch?.status ?? "none"}</div>
        </div>
      ) : null}

      {isMatchOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" role="presentation">
          <div className="absolute inset-0 bg-[var(--color-drawer-backdrop)] backdrop-blur-[3px]" />
          <div
            data-testid="copy-match-modal"
            className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-drawer-surface)] p-6 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-match-modal-title"
          >
            <h3 id="copy-match-modal-title" className="text-2xl font-semibold text-[var(--color-rose-light)]">
              Match ready
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {state?.activeMatch?.matchedUser.username
                ? `@${state.activeMatch.matchedUser.username} completed the same 3-second window with you. Close this to resume copy.`
                : "Both holds completed in the same window. Close this to resume copy."}
            </p>
            <button
              type="button"
              data-testid="copy-match-close"
              onClick={() => {
                void handleCloseMatch();
              }}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)" }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-5 pb-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-[var(--color-rose)] text-[var(--color-rose)]" />
            <h1 className="text-lg font-medium">eyymi copy</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowPreferenceModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
            aria-label="Change preferred match gender"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(4,10,26,0.96),rgba(5,14,30,0.82))] px-5 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Copy</p>
              <h2 className="mt-2 text-[56px] font-semibold leading-none text-[var(--color-rose-light)]">Hold</h2>
              <p className="mt-2 text-base text-[var(--color-text-secondary)]">
                Only the center avatar is matchable in each 3-second window.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
              @{profile?.username ?? storage.getUsername() ?? "you"}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="text-center">
              <span
                data-testid="copy-window-countdown"
                data-window-id={state?.focusWindow?.id ?? ""}
                data-remaining-ms={String(Math.max(0, Math.floor(countdownMs)))}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(20,184,166,0.25)] bg-[rgba(20,184,166,0.12)] text-3xl font-semibold text-[var(--color-teal)]"
              >
                {state?.focusTarget ? countdownValue : "0"}
              </span>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Seconds left on the center avatar</p>
            </div>
          </div>

          <div className="relative mt-8 h-[390px]">
            {carouselCandidates.map((candidate, index) => {
              const slot = [
                { left: "4%", top: "49%", size: 78, scale: 0.78, opacity: 0.5 },
                { left: "23%", top: "34%", size: 94, scale: 0.9, opacity: 0.74 },
                { left: "50%", top: "44%", size: 212, scale: 1, opacity: 1 },
                { left: "77%", top: "34%", size: 94, scale: 0.9, opacity: 0.74 },
                { left: "96%", top: "49%", size: 78, scale: 0.78, opacity: 0.5 },
              ][index]!;
              const isCenter = index === 2;
              const avatar = resolveCopyCarouselAvatar(
                candidate?.avatarId ?? undefined,
                `${candidate?.queueEntryId ?? `slot-${index}`}:${candidate?.username ?? ""}`,
              );

              return (
                <div
                  key={candidate?.queueEntryId ?? `slot-${index}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: slot.left, top: slot.top, opacity: candidate ? slot.opacity : 0.22 }}
                >
                  {isCenter ? (
                    <div className="relative flex h-[240px] w-[240px] items-center justify-center">
                      <RingTrack
                        testId="copy-self-ring"
                        progress={showSelfRing ? selfProgressRatio : 0}
                        color="#2dd4bf"
                        inset={0}
                        direction="clockwise"
                        visible={showSelfRing}
                      />
                      <RingTrack
                        testId="copy-partner-ring"
                        progress={partnerProgressRatio}
                        color="#fb7185"
                        inset={16}
                        direction="counter-clockwise"
                        visible={partnerRingVisible}
                      />
                      <div
                        className="absolute rounded-full border border-white/15 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.24),rgba(45,212,191,0.08)_58%,rgba(4,10,26,0.94)_100%)] shadow-[0_0_34px_rgba(45,212,191,0.24)]"
                        style={{ inset: 32 }}
                      />
                      <div
                        className="relative flex items-center justify-center rounded-full border border-white/20 shadow-xl"
                        style={{
                          height: 156,
                          width: 156,
                          background: avatar.gradient,
                        }}
                      >
                        <span className="text-[88px] leading-none">{avatar.emoji}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-full border border-white/10 shadow-[0_0_26px_rgba(45,212,191,0.18)]"
                      style={{
                        width: slot.size,
                        height: slot.size,
                        transform: `scale(${slot.scale})`,
                        background: avatar.gradient,
                      }}
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <span className={slot.size > 80 ? "text-5xl" : "text-4xl"}>{avatar.emoji}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <p data-testid="copy-center-username" className="text-sm font-medium text-[var(--color-text-primary)]">
              {state?.focusTarget?.username ? `@${state.focusTarget.username}` : "Waiting for players"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {partnerRingVisible
                ? "The second ring is live because the center user is pressing you back in this same window."
                : "Your ring fills clockwise while you hold. The reverse ring appears only when the center user reciprocates."}
            </p>
          </div>

          <div className="mt-auto pt-8">
            <button
              type="button"
              data-testid="copy-press-button"
              aria-label="Press and hold to match"
              aria-pressed={isPressing}
              disabled={!queueEntryId || !state?.focusTarget || showPreferenceModal || isMatchOpen}
              onPointerDown={(event) => {
                event.preventDefault();
                void handleStartPress();
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                void handleEndPress();
              }}
              onPointerCancel={() => {
                void handleEndPress();
              }}
              onPointerLeave={() => {
                if (isPressing) void handleEndPress();
              }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl active:scale-95 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)",
                boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3)",
              }}
            >
              <Fingerprint className="h-12 w-12" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {showNoCandidatesModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[var(--color-drawer-backdrop)]" />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-modal-surface)] p-4">
            <h3 className="text-base font-semibold">No online candidates</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              No online candidates for your selected preference right now.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterMode("all_genders");
                  setShowNoCandidatesModal(false);
                }}
                className="min-h-[44px] rounded-xl bg-[var(--color-rose)] px-4 text-sm font-semibold text-white"
              >
                Continue with all genders
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoCandidatesModal(false);
                  setShowPreferenceModal(true);
                }}
                className="min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 text-sm font-semibold"
              >
                Change preference
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPreferenceModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[var(--color-drawer-backdrop)]" />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-modal-surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Who do you want to match with?</h3>
              {profile?.preferredMatchGender ? (
                <button
                  type="button"
                  onClick={() => setShowPreferenceModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
              This preference can be changed later.
            </p>

            <fieldset className="onboarding-gender-fieldset">
              <div role="radiogroup" aria-label="Preferred gender selection" className="onboarding-gender-grid">
                {onboardingGenderOptions.map((option) => {
                  const Icon = genderOptionIcons[option.value];
                  const isSelected = selectedPreferredGender === option.value;
                  return (
                    <label key={option.value} className="onboarding-gender-option">
                      <input
                        type="radio"
                        name="preferredGender"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => setSelectedPreferredGender(option.value)}
                        className="onboarding-gender-input"
                      />
                      <span className="onboarding-gender-card" data-selected={isSelected ? "true" : "false"}>
                        <span className={`onboarding-gender-icon onboarding-gender-icon--${option.value}`}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className="onboarding-gender-title">{option.title}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              disabled={!selectedPreferredGender || isSavingPreference}
              onClick={() => {
                void handleSavePreference();
              }}
              className="mt-4 min-h-[44px] w-full rounded-xl bg-[var(--color-rose)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSavingPreference ? "Saving..." : "Save preference"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
