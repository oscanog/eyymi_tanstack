import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { convexMutation } from "@/lib/convex";
import { otpAuthStorage } from "@/lib/otpAuth";
import { storage } from "@/lib/storage";
import {
  parseSuggestedUsername,
  sanitizeUsernameInput,
  USERNAME_MIN_LENGTH,
} from "@/lib/username";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { AuthCard } from "@/components/auth/AuthCard";
import { RoutePulseIcon, TrustLinkIcon } from "@/components/icons";
import { signupOnboardingSlides } from "../../data";

export const Route = createFileRoute("/")({
  component: SignupOnboardingPage,
  beforeLoad: async () => {
    return {};
  },
});

interface User {
  _id: string;
  deviceId: string;
  username: string;
  isOnline: boolean;
  lastSeen: number;
}

function SignupOnboardingPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">("forward");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsername, setSuggestedUsername] = useState<string | null>(null);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 3;
  const isUsernameStep = stepIndex === 2;

  const currentFeatureSlide = useMemo(() => signupOnboardingSlides[stepIndex], [stepIndex]);

  const applySuggestedUsername = (nextUsername: string) => {
    setUsername(nextUsername);
    setError(null);
    setIsSuggestionApplied(true);
    setTimeout(() => {
      setIsSuggestionApplied(false);
      setSuggestedUsername(null);
    }, 650);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!otpAuthStorage.hasValidSession()) {
      navigate({ to: "/signin" });
      return;
    }

    if (storage.isAuthenticated()) {
      navigate({ to: "/welcome" });
      return;
    }

    setIsChecking(false);
  }, [navigate]);

  useEffect(() => {
    if (!isChecking && isUsernameStep) {
      inputRef.current?.focus();
    }
  }, [isChecking, isUsernameStep]);

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedUsername = sanitizeUsernameInput(username);

    if (!normalizedUsername || normalizedUsername.length < USERNAME_MIN_LENGTH) {
      setError(`Username must be at least ${USERNAME_MIN_LENGTH} characters`);
      setSuggestedUsername(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const deviceId = crypto.randomUUID();

      const user = await convexMutation<User>("users:upsert", {
        deviceId,
        username: normalizedUsername,
      });

      storage.setAuthData(deviceId, user.username, user._id);
      navigate({ to: "/welcome" });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Onboarding] users:upsert failed", err);
      }

      if (err instanceof Error) {
        const suggestion = parseSuggestedUsername(err.message);

        if (suggestion) {
          setError(`"${normalizedUsername}" is currently active. Try this available username.`);
          setSuggestedUsername(suggestion);
        } else {
          setError("That username is not available. Please try another one.");
          setSuggestedUsername(null);
        }
      } else {
        setError("Failed to create your username. Please try again.");
        setSuggestedUsername(null);
      }
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (stepIndex >= totalSteps - 1) return;
    setStepDirection("forward");
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    setStepDirection("backward");
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-bg)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-[var(--color-rose)] rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-navy-bg)] px-5 py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0) 72%)",
        }}
      />

      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[430px] flex-col items-center justify-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-rose)] text-2xl font-bold text-white shadow-[0_12px_40px_rgba(20,184,166,0.25)]">
          eyymi
        </div>

        <div className="mb-4 flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === stepIndex
                  ? "w-8 bg-[var(--color-rose)]"
                  : index < stepIndex
                    ? "w-4 bg-[var(--color-rose)]/70"
                    : "w-4 bg-white/10"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div
          key={stepIndex}
          className={`w-full onboarding-step-enter ${
            stepDirection === "backward" ? "onboarding-step-enter--backward" : ""
          }`}
        >
          <AuthCard
            title={isUsernameStep ? "Create your username" : "Welcome to eyymi"}
            subtitle={
              isUsernameStep
                ? "Choose your public username to finish your setup."
                : "A quick walkthrough before you start using the app."
            }
          >
            {!isUsernameStep && currentFeatureSlide ? (
              <div>
                <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-navy-elevated)]">
                      {currentFeatureSlide.icon === "routePulse" ? (
                        <RoutePulseIcon className="h-10 w-10" />
                      ) : (
                        <TrustLinkIcon className="h-10 w-10" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text-primary)]">
                        {currentFeatureSlide.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
                        {currentFeatureSlide.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {currentFeatureSlide.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-rose)]" />
                        <p className="text-sm text-[var(--color-text-secondary)]">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={stepIndex === 0}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitUsername} className="space-y-5">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] p-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    This username will be used in sessions and visible to people you connect with.
                  </p>
                </div>

                <Input
                  ref={inputRef}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                    setSuggestedUsername(null);
                  }}
                  placeholder="Enter your username"
                  error={Boolean(error)}
                  className={isSuggestionApplied ? "username-input-autofill" : undefined}
                  maxLength={20}
                  autoComplete="off"
                />

                {suggestedUsername ? (
                  <div className="username-suggestion-card username-suggestion-enter">
                    <p className="text-sm" style={{ color: "var(--color-onboard-suggestion-text)" }}>
                      Suggested available username
                    </p>
                    <button
                      type="button"
                      onClick={() => applySuggestedUsername(suggestedUsername)}
                      className={`username-suggestion-chip ${isSuggestionApplied ? "is-applied" : ""}`}
                      aria-label={`Use suggested username ${suggestedUsername}`}
                    >
                      {suggestedUsername}
                    </button>
                  </div>
                ) : null}

                {error ? <StatusMessage tone="error" message={error} compact /> : null}

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading || username.trim().length < USERNAME_MIN_LENGTH}
                    className="flex-1"
                  >
                    Finish
                  </Button>
                </div>
              </form>
            )}
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

export default SignupOnboardingPage;

