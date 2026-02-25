import { Navigate, createFileRoute } from "@tanstack/react-router";
import {
  BellDot,
  Gift,
  Search,
  Shield,
  Sparkles,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import { CommunityAvatarIcon, VoiceGameIcon } from "@/components/icons";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import {
  voiceCenterCategoryTabs,
  voiceCenterFunctionTiles,
  voiceCenterMiniModeTabs,
  voiceCenterPromos,
  voiceCenterRooms,
  type VoiceCategoryTabKey,
  type VoiceFunctionTileKey,
} from "../../data";

export const Route = createFileRoute("/voice")({
  component: VoiceFunctionCenterPage,
});

function getFlagEmoji(code: string) {
  if (code.length !== 2) return "GL";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

function VoiceFunctionCenterPage() {
  const [activeTab, setActiveTab] = useState<VoiceCategoryTabKey>("for_you");
  const [activeMiniMode, setActiveMiniMode] = useState<(typeof voiceCenterMiniModeTabs)[number]["id"]>("random");
  const [activePromoIndex, setActivePromoIndex] = useState(1);
  const hasOtpAuth = otpAuthStorage.hasValidSession();
  const username = storage.getUsername() ?? "you";

  const filteredRooms = useMemo(() => {
    if (activeTab === "following") return voiceCenterRooms.slice(0, 2);
    if (activeTab === "new") {
      return [...voiceCenterRooms].sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    }
    if (activeTab === "emotion") return voiceCenterRooms.filter((_, index) => index % 2 === 0);
    return voiceCenterRooms;
  }, [activeTab]);

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  const functionIconMap: Record<VoiceFunctionTileKey, typeof Trophy> = {
    ranking: Trophy,
    family: Shield,
    shop: Store,
    reward: Gift,
  };

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-navy-bg)]">
        <header className="safe-area-inset px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">Party Chat</h1>
                <span className="text-xl font-semibold tracking-tight text-[var(--color-rose)]">Function Center</span>
                <Sparkles className="h-4 w-4 text-[var(--color-rose)]/80" />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Voice rooms, function tiles, and discovery for @{username}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative inline-flex h-10 min-w-[46px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(20,184,166,0.16),rgba(142,163,255,0.10))] px-2"
                aria-label="Function badge (static placeholder)"
              >
                <VoiceGameIcon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-[var(--color-navy-bg)] bg-[var(--color-error)]" />
              </button>
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                aria-label="Notifications (placeholder)"
              >
                <BellDot className="h-5 w-5 text-[var(--color-rose)]" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-error)]" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                aria-label="Search (placeholder)"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28">
          <section>
            <div className="grid grid-cols-[0.9fr_1.8fr] gap-3">
              {voiceCenterPromos.slice(0, 2).map((promo, index) => {
                const isActivePromo = activePromoIndex === index;
                const accentClass =
                  promo.accent === "gold"
                    ? "from-amber-300/30 via-orange-300/20 to-[var(--color-navy-surface)]"
                    : promo.accent === "blue"
                      ? "from-blue-300/25 via-indigo-300/15 to-[var(--color-navy-surface)]"
                      : "from-[var(--color-rose)]/25 via-teal-300/12 to-[var(--color-navy-surface)]";

                return (
                  <button
                    key={promo.id}
                    type="button"
                    onClick={() => setActivePromoIndex(index)}
                    className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentClass} p-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition motion-reduce:transition-none ${
                      isActivePromo ? "border-[var(--color-rose)]/45" : "border-[var(--color-border)]"
                    }`}
                    aria-label={`${promo.title} promo (static)`}
                  >
                    <div className="absolute right-2 top-2 h-16 w-16 rounded-full border border-white/10 bg-white/5 blur-[1px]" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
                    <div className="relative">
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        {index === 0 ? (
                          <Users className="h-5 w-5 text-[var(--color-rose)]" />
                        ) : (
                          <VoiceGameIcon className="h-8 w-8" />
                        )}
                      </div>
                      <p className="text-sm font-semibold leading-4">{promo.title}</p>
                      <p className="mt-1 text-[11px] leading-4 text-[var(--color-text-secondary)]">
                        {promo.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-center gap-1.5">
              {voiceCenterPromos.map((promo, index) => (
                <button
                  key={`${promo.id}-dot`}
                  type="button"
                  onClick={() => setActivePromoIndex(index)}
                  className={`h-2 rounded-full transition motion-reduce:transition-none ${
                    activePromoIndex === index ? "w-5 bg-[var(--color-rose)]" : "w-2 bg-white/20"
                  }`}
                  aria-label={`Go to promo ${index + 1}`}
                />
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-4 gap-2">
            {voiceCenterFunctionTiles.map((tile) => {
              const Icon = functionIconMap[tile.icon];
              const iconTint =
                tile.icon === "ranking"
                  ? "text-amber-300"
                  : tile.icon === "family"
                    ? "text-violet-300"
                    : tile.icon === "shop"
                      ? "text-fuchsia-300"
                      : "text-rose-300";

              return (
                <button
                  key={tile.id}
                  type="button"
                  className="relative rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-2 text-center shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
                  aria-label={`${tile.label} (static placeholder)`}
                >
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[var(--color-navy-surface)]">
                    <Icon className={`h-6 w-6 ${iconTint}`} />
                  </div>
                  <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">{tile.label}</p>
                  {tile.badge ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-[var(--color-rose)]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-rose)]">
                      {tile.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </section>

          <section className="mt-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {voiceCenterCategoryTabs.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative min-h-[40px] shrink-0 rounded-xl px-3 text-sm font-semibold transition motion-reduce:transition-none ${
                      active ? "bg-[var(--color-drawer-item-bg)] text-[var(--color-rose)]" : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {tab.label}
                    {active ? (
                      <span className="absolute bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--color-rose)]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-3 space-y-3">
            {filteredRooms.map((room, index) => (
              <article
                key={room.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                      {room.roomType}
                    </span>
                    <span className="rounded-full bg-[var(--color-rose)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--color-rose)]">
                      {room.hostLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{room.roomMood}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0">
                    <CommunityAvatarIcon seed={room.accentSeed} className="h-14 w-14" />
                    <span className="absolute -bottom-1 left-1 inline-flex rounded-full border border-white/10 bg-[var(--color-drawer-item-bg)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-rose)]">
                      {room.memberCount}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{getFlagEmoji(room.countryFlag)}</span>
                      <p className="truncate text-sm font-semibold">{room.name}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--color-drawer-item-bg)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                        {room.topic}
                      </span>
                      {room.isNew ? (
                        <span className="rounded-full bg-[rgba(16,185,129,0.12)] px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          New
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {room.chips.map((chip) => (
                        <span
                          key={`${room.id}-${chip.label}`}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            chip.tone === "mint"
                              ? "bg-[rgba(20,184,166,0.12)] text-[var(--color-rose)]"
                              : chip.tone === "violet"
                                ? "bg-[rgba(142,163,255,0.14)] text-indigo-300"
                                : chip.tone === "amber"
                                  ? "bg-[rgba(251,191,36,0.14)] text-amber-300"
                                  : "bg-[var(--color-drawer-item-bg)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-2 py-2">
                    {[6, 10, 7].map((height, barIndex) => (
                      <span
                        key={`${room.id}-bar-${barIndex}`}
                        className={`block w-1 rounded-full ${barIndex === 2 ? "bg-[var(--color-rose)]" : "bg-[var(--color-text-muted)]"}`}
                        style={{ height }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                      {room.memberCount + index}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="pointer-events-none fixed bottom-24 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 px-16">
            <div className="pointer-events-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)]/95 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.24)] backdrop-blur-md">
              <div className="grid grid-cols-2 gap-2">
                {voiceCenterMiniModeTabs.map((mode) => {
                  const active = mode.id === activeMiniMode;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveMiniMode(mode.id)}
                      className={`min-h-[42px] rounded-xl px-3 text-sm font-medium transition motion-reduce:transition-none ${
                        active
                          ? "bg-[linear-gradient(180deg,rgba(20,184,166,0.22),rgba(20,184,166,0.08))] text-[var(--color-text-primary)]"
                          : "bg-[var(--color-drawer-item-bg)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        <AppBottomNav activeTab="voice" chatBadgeCount={4} />
      </div>
    </div>
  );
}

export default VoiceFunctionCenterPage;
