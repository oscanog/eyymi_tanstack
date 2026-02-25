import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import {
  CommunityAvatarIcon,
  FilterSlidersIcon,
  PartyMatchIcon,
  PlanetOrbitIcon,
  SoulGameIcon,
  VoiceGameIcon,
} from "@/components/icons";
import {
  homeCommunityUsers,
  homeFeatureCards,
  homeQuickBanner,
} from "../../data";

export const Route = createFileRoute("/welcome")({
  component: WelcomePlaceholderPage,
});

function WelcomePlaceholderPage() {
  const navigate = useNavigate();
  const username = storage.getUsername();
  const hasOtpAuth = otpAuthStorage.hasValidSession();

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  const greeting = username ? `Welcome, ${username}` : "Welcome to eyymi";

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-navy-bg)]">
        <header className="safe-area-inset pt-4 pb-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] text-[var(--color-text-primary)]"
              aria-label="Filters (placeholder)"
            >
              <FilterSlidersIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/eyymi-handmark.svg" alt="eyymi" className="h-8 w-8 rounded-full" />
              <p className="text-xl font-semibold tracking-tight">eyymi</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]">
              <img src="/eyymi-handmark.svg" alt="" className="h-6 w-6 rounded-full opacity-90" />
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{greeting}</p>
        </header>

        <main className="flex-1 px-4 pb-24">
          <section className="grid grid-cols-3 gap-3">
            {homeFeatureCards.map((card) => {
              const Icon =
                card.icon === "soul"
                  ? SoulGameIcon
                  : card.icon === "voice"
                    ? VoiceGameIcon
                    : PartyMatchIcon;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    if (card.icon === "soul") {
                      navigate({ to: "/soul_game" });
                    }
                  }}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                  aria-label={
                    card.icon === "soul"
                      ? "Open Soul game"
                      : `${card.title} (coming soon)`
                  }
                >
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-drawer-item-bg)]">
                    <Icon className="h-10 w-10" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{card.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-text-secondary)]">
                    {card.statLabel}
                  </p>
                </button>
              );
            })}
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-drawer-item-bg)]">
                  <PlanetOrbitIcon className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-base font-semibold">{homeQuickBanner.title}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{homeQuickBanner.subtitle}</p>
                </div>
              </div>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-rose)]">
                {homeQuickBanner.chip}
              </span>
            </div>
          </section>

          <section className="mt-4 space-y-2">
            {homeCommunityUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3"
              >
                <div className="relative h-14 w-14 shrink-0">
                  <CommunityAvatarIcon seed={user.iconSeed} className="h-14 w-14" />
                  <span className="absolute bottom-0 right-0 inline-flex h-3.5 w-3.5 rounded-full border-2 border-[var(--color-navy-surface)] bg-[var(--color-rose)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold">{user.name}</p>
                    <span className="rounded-full bg-[var(--color-drawer-item-bg)] px-2 py-0.5 text-xs text-[var(--color-rose)]">
                      {user.age}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[var(--color-text-secondary)]">{user.status}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {user.country} • {user.area}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </main>

        <AppBottomNav activeTab="home" chatBadgeCount={4} />
      </div>
    </div>
  );
}

export default WelcomePlaceholderPage;
