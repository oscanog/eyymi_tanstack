import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Fingerprint, Heart, SlidersHorizontal, X } from "lucide-react";
import { convexMutation } from "@/lib/convex";
import { useConvexQuery, useConvexSubscription } from "@/hooks/useConvexQuery";
import { getCopyCarouselVisualState, getWrappedIndex } from "@/lib/copy-carousel";
import { getProgressRatio, shouldShowNoCandidatesDecision } from "@/lib/copy-match.helpers";
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

type CopyClientState = {
  serverNow: number;
  config: {
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
  activePress: {
    pressEventId: string;
    targetQueueEntryId: string;
    pressStartedAt: number;
    pressEndedAt: number | null;
    durationMs: number | null;
    status: "pending" | "matched" | "expired" | "cancelled";
  } | null;
  match: {
    matchId: string;
    status: "pending_progress" | "ready" | "ended" | "cancelled";
    userAProgressStartAt: number;
    userBProgressStartAt: number;
    progressDurationMs: number;
    readyAt: number | null;
    selfDirection: "clockwise" | "counter_clockwise" | null;
    partner: {
      queueEntryId: string;
      username: string | null;
      avatarId: string | null;
    } | null;
  } | null;
};

const genderOptionIcons: Record<GenderOption, ComponentType<{ className?: string }>> = {
  male: GenderMaleIcon,
  female: GenderFemaleIcon,
  gay: GenderGayIcon,
  lesbian: GenderLesbianIcon,
};

function CopyMatchPage() {
  const userId = storage.getUserId();
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"preferred_only" | "all_genders">("preferred_only");
  const [centerIndex, setCenterIndex] = useState(0);
  const [activePressEventId, setActivePressEventId] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [isMatchedModalOpen, setIsMatchedModalOpen] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showNoCandidatesModal, setShowNoCandidatesModal] = useState(false);
  const [selectedPreferredGender, setSelectedPreferredGender] = useState<GenderOption | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  const { data: profile } = useConvexQuery<UserProfile>(
    "users:get",
    userId ? { userId } : {},
    Boolean(userId)
  );

  const { data: state } = useConvexSubscription<CopyClientState>(
    "copyMatch:getClientState",
    queueEntryId ? { queueEntryId, filterMode } : { filterMode },
    1000,
    true
  );

  const candidates = state?.candidates ?? [];
  const avatarCount = candidates.length;
  const centerCandidate = avatarCount > 0 ? candidates[centerIndex % avatarCount] : null;

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 120);
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
    }).then((result) => {
      if (!cancelled) setQueueEntryId(result.queueEntryId);
    });
    return () => {
      cancelled = true;
    };
  }, [profile, queueEntryId]);

  useEffect(() => {
    if (!queueEntryId) return;
    const interval = window.setInterval(() => {
      void convexMutation("copyMatch:heartbeat", { queueEntryId });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [queueEntryId]);

  useEffect(() => {
    if (!queueEntryId || !centerCandidate || isPressing) return;
    void convexMutation("copyMatch:updateTarget", {
      queueEntryId,
      targetQueueEntryId: centerCandidate.queueEntryId,
    });
  }, [queueEntryId, centerCandidate, isPressing]);

  useEffect(() => {
    if (avatarCount <= 1 || isPressing || isMatchedModalOpen || showPreferenceModal) return;
    const interval = window.setInterval(() => {
      setCenterIndex((prev) => getWrappedIndex(prev, 1, avatarCount));
    }, 2200);
    return () => window.clearInterval(interval);
  }, [avatarCount, isPressing, isMatchedModalOpen, showPreferenceModal]);

  useEffect(() => {
    if (!state?.match || state.match.status !== "ready") return;
    setIsMatchedModalOpen(true);
    setIsPressing(false);
    setActivePressEventId(null);
  }, [state?.match]);

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

  const handleSavePreference = async () => {
    if (!selectedPreferredGender || !userId) return;
    setIsSavingPreference(true);
    try {
      await convexMutation("users:updateMatchPreference", {
        userId,
        preferredMatchGender: selectedPreferredGender,
      });
      if (queueEntryId) {
        await convexMutation("copyMatch:joinQueue", {
          profileUserId: userId,
          username: profile?.username,
          avatarId: profile?.avatarId,
          gender: profile?.gender,
          preferredMatchGender: selectedPreferredGender,
        });
      }
      setShowPreferenceModal(false);
      setFilterMode("preferred_only");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handlePressStart = async () => {
    if (!queueEntryId || !centerCandidate || isPressing || isMatchedModalOpen) return;
    const result = await convexMutation<{
      ok: boolean;
      pressEventId?: string;
    }>("copyMatch:pressStart", {
      queueEntryId,
      targetQueueEntryId: centerCandidate.queueEntryId,
    });
    if (!result.ok || !result.pressEventId) return;
    setActivePressEventId(result.pressEventId);
    setIsPressing(true);
  };

  const handlePressEnd = async () => {
    if (!queueEntryId || !activePressEventId) {
      setIsPressing(false);
      return;
    }
    await convexMutation("copyMatch:pressEnd", {
      queueEntryId,
      pressEventId: activePressEventId,
    });
    setIsPressing(false);
    setActivePressEventId(null);
  };

  const ringProgress = useMemo(() => {
    if (!state?.match) {
      return { self: 0, partner: 0 };
    }
    const selfIsClockwise = state.match.selfDirection === "clockwise";
    const selfStart = selfIsClockwise ? state.match.userAProgressStartAt : state.match.userBProgressStartAt;
    const partnerStart = selfIsClockwise ? state.match.userBProgressStartAt : state.match.userAProgressStartAt;
    return {
      self: getProgressRatio(nowMs, selfStart, state.match.progressDurationMs),
      partner: getProgressRatio(nowMs, partnerStart, state.match.progressDurationMs),
    };
  }, [state?.match, nowMs]);

  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="relative flex h-screen flex-col bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto flex h-full min-h-screen w-full max-w-[430px] flex-col overflow-hidden px-6 pb-8 pt-6">
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 fill-[var(--color-rose)] text-[var(--color-rose)]" />
              <h1 className="text-lg font-medium">Soul game</h1>
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

          <div className="flex flex-1 flex-col items-center justify-center">
            <h2 className="mb-3 text-5xl font-bold text-[var(--color-rose-light)]">Matching</h2>
            <p className="mb-12 text-center text-sm text-[var(--color-text-secondary)]">
              {avatarCount > 0
                ? `Online now ${avatarCount}. Hold to start a quick match`
                : "No other online users available right now."}
            </p>

            <div className="relative mb-12 flex h-40 w-full max-w-sm items-center justify-center">
              {candidates.map((candidate, index) => {
                const visual = getCopyCarouselVisualState(index, centerIndex, avatarCount);
                const avatar = resolveCopyCarouselAvatar(
                  candidate.avatarId ?? undefined,
                  `${candidate.queueEntryId}:${candidate.username ?? ""}`
                );
                return (
                  <div
                    key={candidate.queueEntryId}
                    className="absolute"
                    aria-hidden={!visual.isVisible}
                    style={{
                      transform: `translateX(${visual.x}px) scale(${visual.scale})`,
                      opacity: visual.opacity,
                      filter: `blur(${visual.blur}px) saturate(${visual.saturation})`,
                      zIndex: visual.zIndex,
                    }}
                  >
                    <div className="relative">
                      {visual.isCenter && state?.match ? (
                        <div className="pointer-events-none absolute -inset-3 z-20">
                          <svg viewBox="0 0 120 120" className="h-full w-full">
                            <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
                            <circle
                              cx="60"
                              cy="60"
                              r={ringRadius}
                              fill="none"
                              stroke="var(--color-rose-light)"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={ringCircumference * (1 - ringProgress.self)}
                              transform="rotate(-90 60 60)"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r={ringRadius - 6}
                              fill="none"
                              stroke="rgba(142,163,255,0.95)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * (ringRadius - 6)}
                              strokeDashoffset={2 * Math.PI * (ringRadius - 6) * (1 - ringProgress.partner)}
                              transform="rotate(90 60 60)"
                            />
                          </svg>
                        </div>
                      ) : null}

                      <div
                        className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 shadow-xl"
                        style={{ background: avatar.gradient }}
                      >
                        <span className="text-5xl">{avatar.emoji}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Press and hold to match"
              aria-pressed={isPressing}
              disabled={isMatchedModalOpen || avatarCount === 0 || showPreferenceModal}
              onPointerDown={(event) => {
                event.preventDefault();
                void handlePressStart();
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                void handlePressEnd();
              }}
              onPointerCancel={() => {
                void handlePressEnd();
              }}
              onPointerLeave={() => {
                if (isPressing) void handlePressEnd();
              }}
              className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl active:scale-95 disabled:opacity-70"
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

      {isMatchedModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" role="presentation">
          <div className="absolute inset-0 bg-[var(--color-drawer-backdrop)] backdrop-blur-[3px]" />
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-drawer-surface)] p-6 text-center">
            <h3 className="text-2xl font-semibold text-[var(--color-rose-light)]">Matched!</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Realtime ring connection is complete.
            </p>
            <button
              type="button"
              onClick={() => setIsMatchedModalOpen(false)}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showNoCandidatesModal && (
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
      )}

      {showPreferenceModal && (
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
      )}
    </div>
  );
}
