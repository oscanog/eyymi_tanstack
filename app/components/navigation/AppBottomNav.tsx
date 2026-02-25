import { useNavigate } from "@tanstack/react-router";
import {
  BottomChatIcon,
  BottomHomeIcon,
  BottomMicIcon,
  BottomOrbitIcon,
  BottomProfileIcon,
} from "@/components/icons";

export type AppBottomNavTabKey = "home" | "voice" | "match" | "chat" | "me";

interface AppBottomNavProps {
  activeTab: AppBottomNavTabKey;
  chatBadgeCount?: number;
}

type NavItem = {
  key: AppBottomNavTabKey;
  label: string;
  icon: typeof BottomHomeIcon;
  badge?: number;
};

export function AppBottomNav({ activeTab, chatBadgeCount = 4 }: AppBottomNavProps) {
  const navigate = useNavigate();

  const items: NavItem[] = [
    { key: "home", label: "Home", icon: BottomHomeIcon },
    { key: "voice", label: "Voice", icon: BottomMicIcon },
    { key: "match", label: "Match", icon: BottomOrbitIcon },
    { key: "chat", label: "Chat", icon: BottomChatIcon, badge: chatBadgeCount },
    { key: "me", label: "Me", icon: BottomProfileIcon },
  ];

  const handlePress = (key: AppBottomNavTabKey) => {
    if (key === activeTab) return;

    if (key === "home") {
      void navigate({ to: "/welcome" });
      return;
    }
    if (key === "voice") {
      void navigate({ to: "/voice" });
      return;
    }
    if (key === "match") {
      void navigate({ to: "/soul_game" });
      return;
    }
    if (key === "chat") {
      void navigate({ to: "/chat" });
    }
  };

  return (
    <footer className="safe-area-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 px-4 pb-3">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)]/95 p-2 backdrop-blur-md">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeTab;
            const isNavigable =
              item.key === "home" ||
              item.key === "voice" ||
              item.key === "match" ||
              item.key === "chat";

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handlePress(item.key)}
                className="relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl"
                aria-label={
                  isNavigable
                    ? `Open ${item.label}`
                    : `${item.label} (placeholder)`
                }
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-[var(--color-drawer-item-bg)] text-[var(--color-rose)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] ${
                    isActive ? "text-[var(--color-rose)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="absolute right-2 top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
}

export default AppBottomNav;
