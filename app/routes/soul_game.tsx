import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CommunityAvatarIcon, SoulGameIcon } from "@/components/icons";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import {
  soulGameActionCopy,
  soulGameAvatarCatalog,
  soulGameInlineStatusCopy,
  soulGameTimingConfig,
  soulGameUiStateOrder,
  type SoulGameUiStateKey,
} from "../../data";
import { getSoulGameInlineMessageForState } from "@/features/soul-game/contracts";

export const Route = createFileRoute("/soul_game")({
  component: SoulGameRoute,
});

function SoulGameRoute() {
  const hasOtpAuth = otpAuthStorage.hasValidSession();

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  const username = storage.getUsername() ?? "you";
  const [previewState, setPreviewState] = useState<SoulGameUiStateKey>("idle");

  const inlineMessage = useMemo(
    () => getSoulGameInlineMessageForState(previewState),
    [previewState],
  );

  const toneClass =
    previewState === "matched" || previewState === "session"
      ? "border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10"
      : previewState === "error"
        ? "border-[var(--color-error)]/30 bg-[var(--color-error)]/10"
        : "border-[var(--color-border)] bg-[var(--color-navy-surface)]";

  const ctaLabel =
    previewState === "queueing"
      ? soulGameActionCopy.leaveQueue
      : previewState === "pressing"
        ? soulGameActionCopy.releaseToSubmit
        : previewState === "error"
          ? soulGameActionCopy.tryAgain
          : soulGameActionCopy.pressToMatch;

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
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
              Phase 0
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Contract preview for realtime match states. Backend wiring starts in Phase 1.
          </p>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              UI state preview
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {soulGameUiStateOrder.map((stateKey) => (
                <button
                  key={stateKey}
                  type="button"
                  onClick={() => setPreviewState(stateKey)}
                  className={`min-h-[44px] rounded-xl border px-2 text-xs font-medium capitalize transition motion-reduce:transition-none ${
                    previewState === stateKey
                      ? "border-[var(--color-rose)] bg-[var(--color-rose)]/15 text-[var(--color-text-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] text-[var(--color-text-secondary)]"
                  }`}
                  aria-pressed={previewState === stateKey}
                >
                  {stateKey}
                </button>
              ))}
            </div>
          </section>

          <section
            className={`mt-4 rounded-2xl border p-4 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition motion-reduce:transition-none ${toneClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Inline status
                </p>
                <p className="mt-1 text-base font-semibold">{inlineMessage.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {inlineMessage.description}
                </p>
              </div>
              <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]">
                {previewState}
              </div>
            </div>
            {previewState === "error" ? (
              <div className="mt-3">
                <StatusMessage
                  tone="error"
                  compact
                  message="We could not sync your Soul Game status. Please try again."
                />
              </div>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Rotating candidates (Phase 2/3)
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Rotation contract: every {soulGameTimingConfig.candidateRotateMs / 1000}s, skip self, cycle before repeat.
                </p>
              </div>
              <div className="rounded-full bg-[var(--color-drawer-item-bg)] px-2 py-1 text-xs">
                @{username}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {soulGameAvatarCatalog.slice(0, 5).map((avatar, index) => (
                <div
                  key={avatar.id}
                  className={`rounded-2xl border p-2 text-center ${
                    index === 2
                      ? "border-[var(--color-rose)] bg-[var(--color-rose)]/10"
                      : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                  }`}
                >
                  <CommunityAvatarIcon seed={index + 1} className="mx-auto h-10 w-10" />
                  <p className="mt-1 truncate text-[10px] text-[var(--color-text-secondary)]">
                    {avatar.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-auto pt-8">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>Server overlap contract</span>
                <span>{soulGameTimingConfig.minOverlapMs}ms minimum overlap</span>
              </div>

              <button
                type="button"
                className={`group relative flex h-36 w-full items-center justify-center rounded-full border text-base font-semibold shadow-[0_24px_45px_rgba(0,0,0,0.22)] transition duration-200 motion-reduce:transition-none ${
                  previewState === "pressing"
                    ? "scale-[1.02] border-[var(--color-rose)] bg-[var(--color-rose)]/15"
                    : previewState === "matched"
                      ? "border-[var(--color-rose)] bg-[var(--color-rose)]/20"
                      : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                }`}
                aria-label={`${ctaLabel} (Phase 0 preview)`}
              >
                <span className="absolute inset-3 rounded-full border border-white/10" aria-hidden="true" />
                <span
                  className={`absolute inset-0 rounded-full opacity-0 transition motion-reduce:transition-none ${
                    previewState === "matched"
                      ? "animate-pulse bg-[radial-gradient(circle,rgba(20,184,166,0.20)_0%,rgba(20,184,166,0)_65%)] opacity-100"
                      : ""
                  }`}
                  aria-hidden="true"
                />
                <span className="relative z-10">{ctaLabel}</span>
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

          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Phase 0 contract snapshot
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--color-drawer-item-bg)] p-3 text-[11px] leading-5 text-[var(--color-text-secondary)]">
{JSON.stringify(
  {
    uiState: previewState,
    statusCopy: soulGameInlineStatusCopy[previewState],
    timing: {
      minHoldMs: soulGameTimingConfig.minHoldMs,
      minOverlapMs: soulGameTimingConfig.minOverlapMs,
      sessionDurationMs: soulGameTimingConfig.sessionDurationMs,
    },
  },
  null,
  2,
)}
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
}

export default SoulGameRoute;
