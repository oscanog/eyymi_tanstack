import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Compass,
  Fingerprint,
  Heart,
  MessageCircle,
  Mic,
  X,
} from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import {
  COPY_CAROUSEL_ROTATE_MS,
  COPY_CAROUSEL_TRANSITION_MS,
  COPY_MATCH_HOLD_MS,
  getCopyCarouselVisualState,
  getHoldProgress,
  getWrappedIndex,
} from "../lib/copy-carousel";
import { buildCopyCarouselUsers } from "../lib/copy-online-users";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/copy")({
  component: CopyMatchPage,
});

type CopyNavItem = {
  key: string;
  label: string;
  icon: typeof MessageCircle;
  active?: boolean;
};

const navItems: CopyNavItem[] = [
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "discover", label: "Discover", icon: Compass },
  { key: "match", label: "Match", icon: Heart, active: true },
];

function CopyMatchPage() {
  const { users: onlineUsers, isLoading: isOnlineUsersLoading, error: onlineUsersError } = useOnlineUsers(true);
  const currentUserId = storage.getUserId();
  const currentUsername = storage.getUsername();
  const carouselUsers = buildCopyCarouselUsers(onlineUsers, currentUserId, currentUsername);
  const [centerIndex, setCenterIndex] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [isMatchedModalOpen, setIsMatchedModalOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const avatarCount = carouselUsers.length;
  const holdStartAtRef = useRef<number | null>(null);
  const holdRafIdRef = useRef<number | null>(null);
  const holdCompletedRef = useRef(false);
  const isCarouselPaused = isPressing || isMatchedModalOpen;
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const stopHoldAnimation = useCallback(() => {
    if (holdRafIdRef.current !== null) {
      window.cancelAnimationFrame(holdRafIdRef.current);
      holdRafIdRef.current = null;
    }
  }, []);

  const handleHoldComplete = useCallback(() => {
    if (holdCompletedRef.current) return;
    holdCompletedRef.current = true;
    holdStartAtRef.current = null;
    stopHoldAnimation();
    setHoldProgress(1);
    setIsPressing(false);
    setIsMatchedModalOpen(true);
  }, [stopHoldAnimation]);

  const handlePressStart = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isPressing || isMatchedModalOpen || avatarCount <= 0) return;

      stopHoldAnimation();
      holdCompletedRef.current = false;
      holdStartAtRef.current = performance.now();
      setHoldProgress(0);
      setIsPressing(true);

      const tick = (nowMs: number) => {
        const holdStart = holdStartAtRef.current;
        if (holdStart === null) return;

        const nextProgress = getHoldProgress(nowMs, holdStart, COPY_MATCH_HOLD_MS);
        setHoldProgress(nextProgress);

        if (nextProgress >= 1) {
          handleHoldComplete();
          return;
        }

        holdRafIdRef.current = window.requestAnimationFrame(tick);
      };

      holdRafIdRef.current = window.requestAnimationFrame(tick);
    },
    [avatarCount, handleHoldComplete, isMatchedModalOpen, isPressing, stopHoldAnimation],
  );

  const handlePressEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (holdCompletedRef.current) return;

      holdStartAtRef.current = null;
      stopHoldAnimation();
      setIsPressing(false);
      setHoldProgress(0);
    },
    [stopHoldAnimation],
  );

  const handleCloseMatchedModal = useCallback(() => {
    holdStartAtRef.current = null;
    holdCompletedRef.current = false;
    stopHoldAnimation();
    setHoldProgress(0);
    setIsPressing(false);
    setIsMatchedModalOpen(false);
  }, [stopHoldAnimation]);

  useEffect(() => {
    setCenterIndex((prev) => (avatarCount <= 0 ? 0 : prev % avatarCount));
  }, [avatarCount]);

  useEffect(() => {
    if (avatarCount > 0) return;

    holdStartAtRef.current = null;
    holdCompletedRef.current = false;
    stopHoldAnimation();
    setHoldProgress(0);
    setIsPressing(false);
    setIsMatchedModalOpen(false);
  }, [avatarCount, stopHoldAnimation]);

  useEffect(() => {
    if (avatarCount <= 1 || isCarouselPaused) return;

    const intervalId = window.setInterval(() => {
      setCenterIndex((prev) => getWrappedIndex(prev, 1, avatarCount));
    }, COPY_CAROUSEL_ROTATE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [avatarCount, isCarouselPaused]);

  useEffect(() => {
    return () => {
      stopHoldAnimation();
    };
  }, [stopHoldAnimation]);

  return (
    <>
      <style>{`
        @keyframes copy-match-title-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }
        @keyframes copy-match-center-avatar-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes copy-match-center-glow {
          0%, 100% { transform: scale(1.08); opacity: 0.26; }
          50% { transform: scale(1.2); opacity: 0.44; }
        }
        .copy-match-carousel-item {
          transition:
            transform ${COPY_CAROUSEL_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity ${COPY_CAROUSEL_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
            filter ${COPY_CAROUSEL_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, opacity, filter;
        }
        @media (prefers-reduced-motion: reduce) {
          .copy-match-anim-title,
          .copy-match-anim-center-shell,
          .copy-match-anim-glow {
            animation: none !important;
          }
          .copy-match-carousel-item {
            transition: none !important;
          }
        }
      `}</style>

      <div
        className="relative flex h-screen flex-col text-[var(--color-text-primary)]"
        style={{ backgroundColor: "var(--color-navy-bg)" }}
      >
        <div className="flex-1 overflow-y-auto pb-20">
          <div
            className="flex h-full min-h-screen flex-col overflow-hidden px-6 pb-8 pt-6"
            style={{
              background:
                "radial-gradient(circle at 50% 36%, rgba(20,184,166,0.14) 0%, rgba(20,184,166,0) 56%), linear-gradient(180deg, var(--color-navy-bg) 0%, var(--color-navy-surface) 100%)",
            }}
          >
            <div className="mb-12 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 fill-[var(--color-rose)] text-[var(--color-rose)]" />
                <h1 className="text-lg font-medium text-[var(--color-text-primary)]">Soul game</h1>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              <h2
                className="copy-match-anim-title mb-3 text-5xl font-bold text-[var(--color-rose-light)]"
                style={{
                  animation: "copy-match-title-pulse 1.5s ease-in-out infinite",
                }}
              >
                Matching
              </h2>

              <p className="mb-12 text-center text-sm text-[var(--color-text-secondary)]">
                {avatarCount > 0 ? (
                  <>
                    Online now{" "}
                    <span className="font-semibold text-[var(--color-rose-light)]">{avatarCount}</span>, Hold to start a
                    quick match
                  </>
                ) : isOnlineUsersLoading ? (
                  "Loading online users..."
                ) : (
                  "No other online users available right now."
                )}
              </p>

              <div className="relative mb-12 flex h-40 w-full max-w-sm items-center justify-center">
                {carouselUsers.map((user, index) => {
                  const visual = getCopyCarouselVisualState(index, centerIndex, avatarCount);

                  return (
                    <div
                      key={user._id}
                      className="copy-match-carousel-item absolute"
                      aria-hidden={!visual.isVisible}
                      style={{
                        transform: `translateX(${visual.x}px) scale(${visual.scale})`,
                        opacity: visual.opacity,
                        filter: `blur(${visual.blur}px) saturate(${visual.saturation})`,
                        zIndex: visual.zIndex,
                        pointerEvents: visual.isVisible ? "auto" : "none",
                      }}
                    >
                      <div className="relative">
                        {visual.isCenter && isPressing && !isMatchedModalOpen ? (
                          <div className="pointer-events-none absolute -inset-3 z-20">
                            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                              <circle
                                cx="60"
                                cy="60"
                                r={ringRadius}
                                fill="none"
                                stroke="var(--color-border)"
                                strokeWidth="4"
                                opacity="0.5"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r={ringRadius}
                                fill="none"
                                stroke="var(--color-rose-light)"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringCircumference * (1 - holdProgress)}
                              />
                            </svg>
                          </div>
                        ) : null}

                        {visual.isCenter ? (
                          <div
                            className="copy-match-anim-glow absolute inset-0 rounded-full bg-[var(--color-rose)]"
                            style={{
                              filter: "blur(20px)",
                              animation: "copy-match-center-glow 2s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                          />
                        ) : null}

                        <div
                          className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 shadow-xl ${
                            visual.isCenter ? "copy-match-anim-center-shell" : ""
                          }`}
                          style={{
                            background: user.avatar.gradient,
                            animation: visual.isCenter
                              ? "copy-match-center-avatar-pulse 2s ease-in-out infinite"
                              : undefined,
                          }}
                        >
                          <span className="text-5xl" style={{ filter: "none" }}>
                            {user.avatar.emoji}
                          </span>
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
                disabled={isMatchedModalOpen || avatarCount === 0}
                onPointerDown={handlePressStart}
                onPointerUp={handlePressEnd}
                onPointerCancel={handlePressEnd}
                onPointerLeave={handlePressEnd}
                className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl active:scale-95 disabled:opacity-70"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)",
                  boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3)",
                }}
              >
                <Fingerprint className="h-12 w-12" strokeWidth={1.5} />
              </button>

              <p className="mt-6 text-sm text-[rgba(45,212,191,0.6)]">
                {onlineUsersError ? (
                  <span className="text-[var(--color-error)]">Online users unavailable. Please retry shortly.</span>
                ) : (
                  <>
                    Today you left <span className="font-semibold text-[var(--color-rose-light)]">10</span> match times
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <nav
          className="fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] backdrop-blur-xl"
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "rgba(23, 24, 27, 0.82)",
          }}
        >
          <div className="grid h-16 grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = Boolean(item.active);
              return (
                <button
                  key={item.key}
                  type="button"
                  className="flex flex-col items-center justify-center gap-1 transition-colors"
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-6 w-6 transition-colors ${
                      isActive ? "text-[var(--color-rose-light)]" : "text-[var(--color-text-muted)]"
                    }`}
                  />
                  <span
                    className={`text-[10px] transition-colors ${
                      isActive ? "text-[var(--color-rose-light)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {isMatchedModalOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" role="presentation">
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "var(--color-drawer-backdrop)",
                backdropFilter: "blur(3px)",
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="copy-match-modal-title"
              className="relative w-full max-w-sm rounded-3xl border border-[var(--color-border)] p-6 text-center"
              style={{
                backgroundColor: "var(--color-drawer-surface)",
                color: "var(--color-text-primary)",
                boxShadow: "0 18px 48px rgba(15, 23, 42, 0.28)",
              }}
            >
              <h3 id="copy-match-modal-title" className="text-2xl font-semibold text-[var(--color-rose-light)]">
                Matched!
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your hold was successful. Continue when you are ready.
              </p>
              <button
                type="button"
                onClick={handleCloseMatchedModal}
                autoFocus
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold text-[var(--color-text-primary)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
