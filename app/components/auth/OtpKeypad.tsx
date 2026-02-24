import { Delete } from "lucide-react";

interface OtpKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

export function OtpKeypad({ onDigit, onBackspace, disabled }: OtpKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((key, index) => {
        if (key === "") {
          return <div key={`spacer-${index}`} aria-hidden="true" />;
        }

        if (key === "back") {
          return (
            <button
              key="backspace"
              type="button"
              disabled={disabled}
              onClick={onBackspace}
              className="group flex min-h-[60px] items-center justify-center rounded-2xl border border-white/10 bg-[var(--color-drawer-item-bg)] text-[var(--color-text-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition duration-150 hover:scale-[1.01] hover:border-white/20 active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
              aria-label="Delete digit"
            >
              <Delete className="h-5 w-5 transition-transform duration-150 group-active:scale-90 motion-reduce:transition-none" />
            </button>
          );
        }

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="group relative flex min-h-[60px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-drawer-item-bg)] text-xl font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition duration-150 hover:scale-[1.01] hover:border-[var(--color-rose)]/40 active:scale-95 disabled:opacity-40 motion-reduce:transition-none"
          >
            <span className="absolute inset-0 opacity-0 transition-opacity duration-150 group-active:opacity-100 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.25),transparent_65%)] motion-reduce:transition-none" />
            <span className="relative">{key}</span>
          </button>
        );
      })}
    </div>
  );
}
