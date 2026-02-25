import { Navigate, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Clock3, MessageCircle, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SoulAvatarIcon,
  getSoulAvatarVariantByIndex,
  resolveSoulAvatarVariant,
} from "@/components/icons";
import { useConvexSubscription } from "@/hooks";
import { convexMutation } from "@/lib/convex";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import { getSoulGameAvatarById } from "../../data";

type SoulGameChatState = {
  serverNow: number;
  access: "ok" | "denied";
  errorCode: "SESSION_ACCESS_DENIED" | null;
  session: {
    sessionId: string;
    status: "active" | "ended" | "cancelled" | "missing";
    canChat: boolean;
    startedAt: number;
    endsAt: number;
    meQueueEntryId: string;
    partnerQueueEntryId: string;
    partner: {
      username?: string | null;
      avatarId?: string | null;
    };
  } | null;
  messages: Array<{
    messageId: string;
    senderQueueEntryId: string;
    body: string;
    clientMessageId?: string | null;
    createdAt: number;
  }>;
  typing: {
    selfIsTyping: boolean;
    partnerIsTyping: boolean;
    partnerLastTypingAt?: number | null;
  };
};

type SendMessageResult = {
  ok: boolean;
  reason?: "session_access_denied" | "session_not_active" | "empty_message";
  messageId?: string;
  serverNow: number;
};

type SetTypingResult = {
  ok: boolean;
  reason?: "session_access_denied" | "session_not_active";
  serverNow: number;
};

function formatCountdown(msRemaining: number) {
  const safe = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function getDeterministicAvatarVariant(input: string | undefined | null, fallbackIndex = 0) {
  if (!input) return getSoulAvatarVariantByIndex(fallbackIndex);
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return getSoulAvatarVariantByIndex(hash % 10);
}

function getBoundSoulAvatarVariant(
  avatarId: string | undefined | null,
  fallbackInput: string | undefined | null,
  fallbackIndex = 0,
) {
  const meta = getSoulGameAvatarById(avatarId);
  if (meta) return resolveSoulAvatarVariant(meta.iconKey, fallbackIndex);
  return getDeterministicAvatarVariant(fallbackInput, fallbackIndex);
}

export const Route = createFileRoute("/soul_game/chat/$sessionId")({
  validateSearch: (search: Record<string, unknown>) => ({
    queueEntryId: typeof search.queueEntryId === "string" ? search.queueEntryId : undefined,
  }),
  component: SoulGameChatRoute,
});

function SoulGameChatRoute() {
  const navigate = useNavigate();
  const { sessionId } = useParams({ from: "/soul_game/chat/$sessionId" });
  const search = Route.useSearch();
  const [isHydrated, setIsHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [pendingClientMessageIds, setPendingClientMessageIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingIdleTimeoutRef = useRef<number | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const lastTypingStateRef = useRef(false);

  const hasOtpAuth = isHydrated ? otpAuthStorage.hasValidSession() : true;
  const username = isHydrated ? storage.getUsername() ?? "you" : "you";
  const queueEntryId = search.queueEntryId;

  const shouldSubscribe = isHydrated && hasOtpAuth && Boolean(queueEntryId);
  const {
    data: chatState,
    isLoading: isChatLoading,
    error: chatError,
  } = useConvexSubscription<SoulGameChatState>(
    "soulGameChat:getState",
    shouldSubscribe ? { sessionId, queueEntryId } : {},
    700,
    shouldSubscribe,
  );

  const meAvatarVariant = useMemo(
    () => getBoundSoulAvatarVariant(null, `${queueEntryId ?? username}:self`, 0),
    [queueEntryId, username],
  );
  const partnerAvatarVariant = useMemo(
    () => getBoundSoulAvatarVariant(chatState?.session?.partner.avatarId, chatState?.session?.partnerQueueEntryId, 1),
    [chatState?.session?.partner.avatarId, chatState?.session?.partnerQueueEntryId],
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!chatError) return;
    setComposerError("Live chat sync is having trouble right now. Please wait a moment or reopen Soul Game.");
  }, [chatError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatState?.messages.length, chatState?.typing.partnerIsTyping]);

  const sendTyping = async (isTyping: boolean, force = false) => {
    if (!queueEntryId || !chatState?.session?.canChat) return;
    const now = Date.now();
    const elapsed = now - lastTypingSentAtRef.current;
    if (!force && lastTypingStateRef.current === isTyping && elapsed < 700) {
      return;
    }
    lastTypingSentAtRef.current = now;
    lastTypingStateRef.current = isTyping;
    try {
      const result = await convexMutation<SetTypingResult>("soulGameChat:setTyping", {
        sessionId,
        queueEntryId,
        isTyping,
      });
      if (!result.ok) {
        if (result.reason === "session_not_active") {
          setInlineNotice("Chat session has ended.");
        }
      }
    } catch {
      // Keep UI friendly and non-blocking for typing pings.
    }
  };

  useEffect(() => {
    if (!queueEntryId || !chatState?.session?.canChat) return;
    const hasText = draft.trim().length > 0;
    if (!hasText) {
      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current);
        typingIdleTimeoutRef.current = null;
      }
      void sendTyping(false);
      return;
    }

    void sendTyping(true);

    if (typingIdleTimeoutRef.current) {
      window.clearTimeout(typingIdleTimeoutRef.current);
    }
    typingIdleTimeoutRef.current = window.setTimeout(() => {
      void sendTyping(false, true);
    }, 1200);

    return () => {
      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current);
        typingIdleTimeoutRef.current = null;
      }
    };
  }, [draft, chatState?.session?.canChat, queueEntryId]);

  useEffect(() => {
    return () => {
      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current);
      }
      if (queueEntryId) {
        void convexMutation("soulGameChat:setTyping", {
          sessionId,
          queueEntryId,
          isTyping: false,
        }).catch(() => {});
      }
    };
  }, [queueEntryId, sessionId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!queueEntryId || !chatState?.session) return;
    if (!chatState.session.canChat) {
      setComposerError("This chat session has already ended.");
      return;
    }
    if (!text) return;

    setComposerError(null);
    setInlineNotice(null);
    setIsSending(true);

    const clientMessageId = `${queueEntryId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    setPendingClientMessageIds((prev) => [...prev, clientMessageId]);

    try {
      const result = await convexMutation<SendMessageResult>("soulGameChat:sendMessage", {
        sessionId,
        queueEntryId,
        body: text,
        clientMessageId,
      });

      if (!result.ok) {
        setComposerError(
          result.reason === "session_not_active"
            ? "Session ended before your message was sent."
            : "Unable to send message right now. Please try again.",
        );
        return;
      }

      setDraft("");
      void sendTyping(false, true);
    } catch {
      setComposerError("Unable to send message right now. Please check connection and try again.");
    } finally {
      setPendingClientMessageIds((prev) => prev.filter((id) => id !== clientMessageId));
      setIsSending(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center px-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Loading chat...
          </div>
        </div>
      </div>
    );
  }

  if (!hasOtpAuth) {
    return <Navigate to="/signin" />;
  }

  if (!queueEntryId) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center px-4 py-8">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
            <p className="text-sm font-semibold">Missing chat access token</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Please return to Soul Game and rematch to enter the live chat.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/soul_game" })}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 text-sm font-medium"
            >
              Back to Soul Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sessionState = chatState?.session;
  const isAccessDenied = chatState?.access === "denied";
  const canChat = Boolean(sessionState?.canChat);
  const countdownMs = sessionState ? sessionState.endsAt - (chatState?.serverNow ?? Date.now()) : 0;
  const partnerName = sessionState?.partner.username ? `@${sessionState.partner.username}` : "@soul";
  const selfQueueId = sessionState?.meQueueEntryId ?? queueEntryId;
  const connectionLabel =
    isChatLoading && !chatState ? "Connecting..." : chatError ? "Reconnecting..." : "Live";

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--color-navy-bg)] px-4 pt-4 pb-4">
        <header className="safe-area-inset">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/soul_game" })}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]"
                aria-label="Back to Soul Game"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2">
                <SoulAvatarIcon variant={partnerAvatarVariant} className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{partnerName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {connectionLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {sessionState ? formatCountdown(countdownMs) : "--:--"}
                    </span>
                    {chatState?.typing.partnerIsTyping ? (
                      <span className="text-[var(--color-rose)]">typing...</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-navy-surface)]">
          <div className="border-b border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-secondary)]">
            Live Soul chat (ephemeral): messages are for this active session only.
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {isAccessDenied ? (
              <div className="rounded-2xl border border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.08)] p-4 text-sm">
                <p className="font-semibold">Chat access unavailable</p>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                  This Soul Game chat is not available for your current session entry.
                </p>
              </div>
            ) : null}

            {!isAccessDenied && (chatState?.messages.length ?? 0) === 0 && !isChatLoading ? (
              <div className="mx-2 mt-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 py-5 text-center text-sm text-[var(--color-text-secondary)]">
                Say hi. The first message appears here in realtime.
              </div>
            ) : null}

            <div className="space-y-2">
              {(chatState?.messages ?? []).map((message) => {
                const isSelf = message.senderQueueEntryId === selfQueueId;
                const bubbleTone = isSelf
                  ? "border-[var(--color-rose)]/25 bg-[linear-gradient(180deg,rgba(20,184,166,0.18),rgba(20,184,166,0.08))]"
                  : "border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]";
                return (
                  <div
                    key={message.messageId}
                    className={`flex items-end gap-2 ${isSelf ? "justify-end" : "justify-start"}`}
                  >
                    {!isSelf ? (
                      <SoulAvatarIcon variant={partnerAvatarVariant} className="h-8 w-8 shrink-0" />
                    ) : null}
                    <div className={`max-w-[82%] rounded-2xl border px-3 py-2 ${bubbleTone}`}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                      <p className={`mt-1 text-[10px] ${isSelf ? "text-[var(--color-rose)]/90" : "text-[var(--color-text-muted)]"}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                    {isSelf ? (
                      <SoulAvatarIcon variant={meAvatarVariant} className="h-8 w-8 shrink-0" />
                    ) : null}
                  </div>
                );
              })}

              {chatState?.typing.partnerIsTyping ? (
                <div className="flex items-end gap-2">
                  <SoulAvatarIcon variant={partnerAvatarVariant} className="h-8 w-8 shrink-0" />
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                    typing...
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] bg-[var(--color-drawer-item-bg)]/70 p-3">
            {inlineNotice ? (
              <p className="mb-2 text-xs text-[var(--color-text-secondary)]">{inlineNotice}</p>
            ) : null}
            {composerError ? (
              <p className="mb-2 text-xs text-[var(--color-rose)]">{composerError}</p>
            ) : null}
            {!canChat && sessionState ? (
              <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
                This 2-minute chat session ended. You can go back to Soul Game to match again.
              </p>
            ) : null}

            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] px-3 py-2">
                <SoulAvatarIcon variant={meAvatarVariant} className="mb-1 h-8 w-8 shrink-0" />
                <textarea
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setComposerError(null);
                  }}
                  onBlur={() => {
                    void sendTyping(false, true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!isSending) {
                        void handleSend();
                      }
                    }
                  }}
                  placeholder={canChat ? "Type your message..." : "Session ended"}
                  disabled={!canChat || isSending || isAccessDenied}
                  rows={1}
                  className="max-h-32 min-h-[44px] w-full resize-none bg-transparent py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canChat || isSending || isAccessDenied || draft.trim().length === 0}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border transition motion-reduce:transition-none ${
                  !canChat || isAccessDenied || draft.trim().length === 0
                    ? "border-[var(--color-border)] bg-[var(--color-navy-surface)] text-[var(--color-text-muted)]"
                    : isSending
                      ? "border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10 text-[var(--color-rose)]"
                      : "border-[var(--color-rose)]/40 bg-[linear-gradient(180deg,rgba(20,184,166,0.18),rgba(20,184,166,0.08))] text-[var(--color-rose)] active:translate-y-[1px]"
                }`}
                aria-label="Send message"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>You on right • partner on left</span>
              <span>{pendingClientMessageIds.length > 0 ? "Sending..." : `${draft.trim().length}/1000`}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SoulGameChatRoute;
