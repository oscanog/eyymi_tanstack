import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusTone = "error" | "success" | "info";

interface StatusMessageProps {
  tone?: StatusTone;
  title?: string;
  message: string;
  className?: string;
  compact?: boolean;
}

const toneStyles: Record<StatusTone, { box: string; icon: string; title: string; text: string }> = {
  error: {
    box: "border-[color:rgba(239,68,68,0.28)] bg-[color:rgba(239,68,68,0.10)]",
    icon: "text-[var(--color-error)]",
    title: "text-[var(--color-error)]",
    text: "text-[var(--color-text-primary)]",
  },
  success: {
    box: "border-[color:rgba(34,197,94,0.28)] bg-[color:rgba(34,197,94,0.10)]",
    icon: "text-[var(--color-success)]",
    title: "text-[var(--color-success)]",
    text: "text-[var(--color-text-primary)]",
  },
  info: {
    box: "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]",
    icon: "text-[var(--color-rose)]",
    title: "text-[var(--color-text-primary)]",
    text: "text-[var(--color-text-secondary)]",
  },
};

export function StatusMessage({
  tone = "info",
  title,
  message,
  className,
  compact = false,
}: StatusMessageProps) {
  const styles = toneStyles[tone];
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border backdrop-blur-sm",
        compact ? "px-3 py-2" : "px-3.5 py-3",
        styles.box,
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", styles.icon)} aria-hidden="true" />
        <div className="min-w-0">
          {title ? (
            <p className={cn("text-sm font-semibold", styles.title)}>{title}</p>
          ) : null}
          <p className={cn("text-sm leading-5", styles.text, title && "mt-0.5")}>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default StatusMessage;

