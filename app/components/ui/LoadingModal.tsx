interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  logoSrc?: string;
}

export function LoadingModal({
  isOpen,
  title,
  subtitle,
  logoSrc = "/eyymi-handmark.svg",
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center px-5"
      aria-live="polite"
      aria-busy="true"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8, 8, 10, 0.72)", backdropFilter: "blur(10px)" }}
      />

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        style={{
          backgroundColor: "var(--color-modal-surface)",
          borderColor: "var(--color-modal-border)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-16 right-[-40px] h-40 w-40 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(20,184,166,0) 72%)",
          }}
        />

        <div className="relative mb-4 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <div className="absolute inset-0 rounded-full border border-white/8" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-rose)] border-r-[var(--color-rose-light)]" />
            <div className="absolute inset-[6px] rounded-full bg-[var(--color-navy-surface)]/95 p-1.5 shadow-inner">
              <img
                src={logoSrc}
                alt="EYYMI logo"
                className="h-full w-full rounded-full object-contain"
                draggable={false}
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[var(--color-text-primary)]">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[var(--color-rose)]" />
            <span className="text-xs font-medium tracking-wide text-[var(--color-text-secondary)]">
              Preparing your account
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="auth-loading-progress h-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingModal;

