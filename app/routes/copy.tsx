import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  Fingerprint,
  Heart,
  MessageCircle,
  Mic,
  X,
} from "lucide-react";

export const Route = createFileRoute("/copy")({
  component: CopyMatchPage,
});

type CarouselAvatar = {
  id: number;
  emoji: string;
  gradient: string;
  position: "far-left" | "left" | "center" | "right" | "far-right";
  isCenter?: boolean;
};

const carouselAvatars: CarouselAvatar[] = [
  {
    id: 0,
    emoji: "🤖",
    gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
    position: "far-left",
  },
  {
    id: 1,
    emoji: "👹",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)",
    position: "left",
  },
  {
    id: 2,
    emoji: "😢",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 58%, #60A5FA 100%)",
    position: "center",
    isCenter: true,
  },
  {
    id: 3,
    emoji: "👾",
    gradient: "linear-gradient(135deg, #1F2024 0%, #14B8A6 100%)",
    position: "right",
  },
  {
    id: 4,
    emoji: "👻",
    gradient: "linear-gradient(135deg, #1F2024 0%, #3B82F6 100%)",
    position: "far-right",
  },
];

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
  return (
    <>
      <style>{`
        @keyframes copy-match-title-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes copy-match-center-avatar-pulse {
          0%, 100% { transform: scale(1.5); }
          50% { transform: scale(1.55); }
        }
        @keyframes copy-match-center-glow {
          0%, 100% { transform: scale(1.1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .copy-match-anim-title,
          .copy-match-anim-center,
          .copy-match-anim-glow {
            animation: none !important;
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
                Queuing number{" "}
                <span className="font-semibold text-[var(--color-rose-light)]">36</span>, Wait about{" "}
                <span className="font-semibold text-[var(--color-text-primary)]">3</span> minute(s)
              </p>

              <div className="relative mb-12 flex h-40 w-full max-w-sm items-center justify-center">
                {carouselAvatars.map((avatar) => {
                  const isCenter = Boolean(avatar.isCenter);
                  const isFar =
                    avatar.position === "far-left" || avatar.position === "far-right";
                  const scale = isCenter ? 1.5 : isFar ? 0.8 : 1;
                  const opacity = isCenter ? 1 : isFar ? 0.3 : 0.6;
                  const blur = isCenter ? 0 : isFar ? 8 : 2;

                  let x = 0;
                  if (avatar.position === "far-left") x = -180;
                  if (avatar.position === "left") x = -100;
                  if (avatar.position === "right") x = 100;
                  if (avatar.position === "far-right") x = 180;

                  return (
                    <div
                      key={avatar.id}
                      className={isCenter ? "copy-match-anim-center absolute" : "absolute"}
                      style={{
                        transform: `translateX(${x}px) scale(${scale})`,
                        opacity,
                        filter: `blur(${blur}px) ${isCenter ? "saturate(1)" : "saturate(0.5)"}`,
                        animation: isCenter
                          ? "copy-match-center-avatar-pulse 2s ease-in-out infinite"
                          : undefined,
                      }}
                    >
                      <div className="relative">
                        {isCenter ? (
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
                          className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 shadow-xl"
                          style={{ background: avatar.gradient }}
                        >
                          <span className="text-5xl" style={{ filter: "none" }}>
                            {avatar.emoji}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Cancel matching"
                className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-rose) 0%, var(--color-rose-light) 100%)",
                  boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3)",
                }}
              >
                <Fingerprint className="h-12 w-12" strokeWidth={1.5} />
              </button>

              <p className="mt-6 text-sm text-[rgba(45,212,191,0.6)]">
                Today you left{" "}
                <span className="font-semibold text-[var(--color-rose-light)]">10</span> match times
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
      </div>
    </>
  );
}
