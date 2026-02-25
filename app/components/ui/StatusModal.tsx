import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";

interface StatusModalProps {
  isOpen: boolean;
  tone?: "error" | "success" | "info";
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function StatusModal({
  isOpen,
  tone = "info",
  title,
  message,
  confirmLabel = "OK",
  onClose,
  onConfirm,
}: StatusModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close status dialog"
        onClick={onClose}
        className="fixed inset-0 z-[980] bg-[var(--color-modal-backdrop)]"
      />
      <div className="fixed inset-0 z-[990] flex items-center justify-center px-5">
        <div
          className="w-full max-w-sm rounded-2xl border p-4 shadow-[0_24px_56px_rgba(0,0,0,0.35)]"
          style={{
            backgroundColor: "var(--color-modal-surface)",
            borderColor: "var(--color-modal-border)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="status-modal-title" className="text-base font-semibold text-[var(--color-modal-text)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-modal-border)] bg-[var(--color-modal-muted-bg)]"
              aria-label="Close status dialog"
            >
              <X className="h-4 w-4 text-[var(--color-modal-text)]" />
            </button>
          </div>

          <StatusMessage tone={tone} message={message} compact />

          <div className="mt-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default StatusModal;

