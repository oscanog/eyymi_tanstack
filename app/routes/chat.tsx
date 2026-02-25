import { Navigate, createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  Diamond,
  Grid2x2,
  MessageCircleMore,
  Sparkles,
  Volume2,
} from "lucide-react";
import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import { CommunityAvatarIcon } from "@/components/icons";
import { otpAuthStorage } from "@/lib/otpAuth";
import {
  chatHubConnectedSummary,
  chatHubConversations,
  chatHubOnlineCards,
  chatHubPromo,
} from "../../data";

export const Route = createFileRoute("/chat")({
  component: ChatHubPage,
});

function getFlagEmoji(code: string) {
  if (code.length !== 2) return "GL";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

function ChatHubPage() {
  const hasOtpAuth = otpAuthStorage.hasValidSession();

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-navy-bg)]">
        <header className="safe-area-inset px-4 pt-4 pb-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                aria-label="Grid menu (placeholder)"
              >
                <Grid2x2 className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-error)]" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
                <button
                  type="button"
                  className="mt-0.5 inline-flex max-w-full items-center justify-center gap-1 rounded-full px-2 py-0.5 text-sm text-[var(--color-text-secondary)]"
                  aria-label="Party filter (static)"
                >
                  <span className="truncate">Join your friends&apos; party now!</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </button>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(20,184,166,0.12),rgba(142,163,255,0.10))]"
                aria-label="Mascot shortcut (placeholder)"
              >
                <Sparkles className="h-5 w-5 text-[var(--color-rose)]" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28">
          <section className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 pb-1">
              {chatHubOnlineCards.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  className="w-[144px] shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3 text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                  aria-label={`Open ${card.name} chat (static placeholder)`}
                >
                  <div className="mx-auto relative h-16 w-16">
                    <CommunityAvatarIcon seed={card.accentSeed + index} className="h-16 w-16" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      ♀ {card.level}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-xs text-[var(--color-text-secondary)]">
                    {getFlagEmoji(card.countryFlag)} {card.name}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">Following Online</p>
                  <div className="mt-4 inline-flex items-end gap-1 text-[var(--color-text-secondary)]">
                    {[8, 12, 10].map((h, i) => (
                      <span
                        key={`${card.id}-sig-${i}`}
                        className={`w-1 rounded-full ${i === 1 ? "bg-[var(--color-rose)]" : "bg-[var(--color-text-muted)]"}`}
                        style={{ height: h }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold">{card.signalCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.10)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(20,184,166,0.14),rgba(142,163,255,0.10))]">
                <Diamond className="h-6 w-6 text-[var(--color-rose)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {chatHubPromo.title} <span className="text-[var(--color-rose)]">♦</span>
                </p>
                <p className="truncate text-sm text-[var(--color-text-secondary)]">{chatHubPromo.subtitle}</p>
              </div>
              {chatHubPromo.badgeDot ? (
                <span className="inline-flex h-3 w-3 rounded-full bg-[var(--color-error)]" aria-hidden="true" />
              ) : null}
            </div>
          </section>

          <section className="mt-4 space-y-2">
            {chatHubConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-[0_8px_18px_rgba(0,0,0,0.08)] ${
                  item.isPinned
                    ? "border-[var(--color-rose)]/20 bg-[linear-gradient(180deg,rgba(20,184,166,0.08),rgba(255,255,255,0.02))]"
                    : "border-[var(--color-border)] bg-[var(--color-navy-surface)]"
                }`}
                aria-label={`Open chat with ${item.name} (static placeholder)`}
              >
                <div className="relative h-14 w-14 shrink-0">
                  <CommunityAvatarIcon seed={item.accentSeed} className="h-14 w-14" />
                  {item.level > 0 ? (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-rose)]/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      ♀ {item.level}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{getFlagEmoji(item.countryFlag)}</span>
                    <p className="truncate text-base font-semibold">{item.name}</p>
                    {item.isVerified ? (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(251,191,36,0.16)] text-amber-300">
                        <Sparkles className="h-3 w-3" />
                      </span>
                    ) : null}
                    {item.badgeLabel ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.badgeTone === "mint"
                            ? "bg-[rgba(20,184,166,0.12)] text-[var(--color-rose)]"
                            : item.badgeTone === "violet"
                              ? "bg-[rgba(142,163,255,0.14)] text-indigo-300"
                              : "bg-[var(--color-drawer-item-bg)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {item.badgeLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    {item.muted ? <Volume2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" /> : null}
                    <p className="truncate text-sm text-[var(--color-text-secondary)]">{item.preview}</p>
                  </div>
                </div>

                <div className="flex min-w-[68px] flex-col items-end gap-2">
                  <p className="text-xs text-[var(--color-text-muted)]">{item.timestamp}</p>
                  {item.unreadCount ? (
                    <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-xs font-semibold text-white">
                      {item.unreadCount}
                    </span>
                  ) : null}
                  {item.isPinned ? (
                    <span className="text-[10px] font-medium text-[var(--color-rose)]">Pinned</span>
                  ) : null}
                </div>
              </button>
            ))}
          </section>

          <div className="pointer-events-none fixed bottom-22 right-1/2 z-10 w-full max-w-[430px] translate-x-1/2 px-4">
            <div className="ml-auto w-fit pointer-events-auto rounded-full border border-[var(--color-border)] bg-[var(--color-navy-surface)]/95 px-4 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <MessageCircleMore className="h-4 w-4 text-[var(--color-rose)]" />
                <span className="text-sm font-medium">
                  {chatHubConnectedSummary.label} {chatHubConnectedSummary.count}
                </span>
                <span className="text-[var(--color-text-muted)]">›</span>
              </div>
            </div>
          </div>
        </main>

        <AppBottomNav activeTab="chat" chatBadgeCount={6} />
      </div>
    </div>
  );
}

export default ChatHubPage;
