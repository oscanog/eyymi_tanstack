import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { convexMutation, convexQuery } from "@/lib/convex";
import { otpAuthStorage } from "@/lib/otpAuth";
import { isDevFakePhoneInput, normalizePhoneToE164, type SupportedCountry } from "@/lib/phoneNumber";
import { storage } from "@/lib/storage";
import { AuthCard } from "./AuthCard";
import { PhoneNumberField } from "./PhoneNumberField";
import { OtpKeypad } from "./OtpKeypad";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { LoadingModal } from "@/components/ui/LoadingModal";

type AuthMode = "signin" | "signup";

interface AuthPhoneOtpFlowProps {
  mode: AuthMode;
}

interface RequestCodeResult {
  challengeId: string;
  expiresAt: number;
  resendAvailableAt: number;
  otpLength: number;
  accountExists: boolean;
  normalizedPhoneE164: string;
}

interface VerifyCodeResult {
  sessionToken: string;
  expiresAt: number;
  authUser: {
    _id: string;
    phoneE164: string;
    status: "active" | "blocked" | "deleted";
  };
  isNewUser: boolean;
}

interface CurrentSessionResult {
  session: { _id: string; expiresAt: number };
  authUser: { _id: string; phoneE164: string };
}

function formatCountdown(targetTs: number): string {
  const seconds = Math.max(0, Math.ceil((targetTs - Date.now()) / 1000));
  return `${seconds}s`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toUserFriendlyAuthMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const raw = error.message || "";

  // Known backend/auth cases (strict signin/signup + OTP lifecycle)
  if (raw.includes("No account found for this phone number")) {
    return "No account found for this phone number. Please sign up first.";
  }
  if (raw.includes("already registered")) {
    return "This phone number is already registered. Please sign in instead.";
  }
  if (raw.includes("Please wait before requesting another code")) {
    return "Please wait a moment before requesting another code.";
  }
  if (raw.includes("OTP has expired")) {
    return "Your code expired. Please request a new one.";
  }
  if (raw.includes("Invalid OTP code")) {
    return "The code you entered is incorrect. Please try again.";
  }
  if (raw.includes("Too many OTP attempts")) {
    return "Too many incorrect attempts. Please request a new code.";
  }
  if (raw.includes("OTP code must be 6 digits")) {
    return "Enter the full 6-digit code.";
  }
  if (raw.includes("Phone number is required")) {
    return "Please enter your phone number.";
  }
  if (raw.includes("Phone number format is invalid") || raw.includes("Only valid mobile phone numbers are supported")) {
    return "Please enter a valid mobile phone number.";
  }
  if (raw.includes("OTP challenge is no longer valid")) {
    return "This code is no longer valid. Please request a new one.";
  }

  // Strip noisy transport/debug details if present.
  const stripped = raw
    .replace(/\[Request ID:[^\]]+\]\s*/gi, "")
    .replace(/Uncaught\s*ConvexError:\s*/gi, "")
    .replace(/ConvexError:\s*/gi, "")
    .replace(/\s+at handler[\s\S]*$/gi, "")
    .trim();

  if (!stripped) {
    return "Something went wrong. Please try again.";
  }

  // Final fallback: keep it short and user-safe (no stack/request noise).
  return stripped.length > 180 ? "Something went wrong. Please try again." : stripped;
}

export function AuthPhoneOtpFlow({ mode }: AuthPhoneOtpFlowProps) {
  const navigate = useNavigate();
  const [country, setCountry] = useState<SupportedCountry>("PH");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [isSignupTransitionLoading, setIsSignupTransitionLoading] = useState(false);
  const [, setTick] = useState(0);

  const title = mode === "signin" ? "Sign in" : "Sign up";
  const subtitle =
    mode === "signin"
      ? "Use your phone number to continue to EYYMI"
      : "Create your EYYMI account with your phone number";
  const alternateCta =
    mode === "signin"
      ? { label: "Doesn't have an account yet? Sign up", to: "/signup" as const }
      : { label: "Already have an account? Sign in", to: "/signin" as const };

  useEffect(() => {
    if (!otpAuthStorage.hasValidSession()) return;
    const session = otpAuthStorage.getSession();
    if (!session) return;

    void convexQuery<CurrentSessionResult | null>("authSessions:getCurrent", {
      sessionToken: session.sessionToken,
    })
      .then((result) => {
        if (!result) {
          otpAuthStorage.clear();
          return;
        }
        if (storage.isAuthenticated()) {
          navigate({ to: "/welcome" });
        } else {
          navigate({ to: "/" });
        }
      })
      .catch(() => {
        // Ignore on mount; user can continue login flow.
      });
  }, [navigate]);

  useEffect(() => {
    if (!resendAvailableAt) return;
    const interval = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(interval);
  }, [resendAvailableAt]);

  const otpValue = useMemo(() => otpDigits.join(""), [otpDigits]);
  const canResend = resendAvailableAt !== null && resendAvailableAt <= Date.now();

  const requestOtp = async () => {
    setPhoneError(null);
    setOtpError(null);

    let phoneE164: string;
    try {
      phoneE164 = normalizePhoneToE164(phoneInput, country);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Invalid phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await convexMutation<RequestCodeResult>("authOtp:requestCode", {
        phone: phoneE164,
        purpose: mode,
        deviceId: storage.getDeviceId() ?? crypto.randomUUID(),
      });
      setChallengeId(result.challengeId);
      setNormalizedPhone(result.normalizedPhoneE164);
      setResendAvailableAt(result.resendAvailableAt);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep("otp");
    } catch (err) {
      setPhoneError(toUserFriendlyAuthMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!challengeId) return;
    if (otpValue.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }

    setIsSubmitting(true);
    setOtpError(null);
    try {
      const result = await convexMutation<VerifyCodeResult>("authOtp:verifyCode", {
        challengeId,
        code: otpValue,
        deviceId: storage.getDeviceId() ?? crypto.randomUUID(),
        platform: "web",
        appVersion: "mvp",
      });
      otpAuthStorage.setSession({
        sessionToken: result.sessionToken,
        authUserId: result.authUser._id,
        phoneE164: result.authUser.phoneE164,
        expiresAt: result.expiresAt,
      });
      otpAuthStorage.setPostAuthRouteIntent(mode);

      // OTP auth is now the source of truth for the entry path.
      // Do not rely on previous local username/device state here.
      if (mode === "signup") {
        setIsSignupTransitionLoading(true);
        storage.clear();
        await wait(1000);
        navigate({ to: "/" });
      } else {
        navigate({ to: "/welcome" });
      }
    } catch (err) {
      setOtpError(toUserFriendlyAuthMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (isSubmitting) return;
    setOtpError(null);
    setOtpDigits((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d === "");
      if (idx === -1) return prev;
      next[idx] = digit;
      return next;
    });
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    setOtpError(null);
    setOtpDigits((prev) => {
      const next = [...prev];
      let idx = -1;
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i] !== "") {
          idx = i;
          break;
        }
      }
      if (idx === -1) return prev;
      next[idx] = "";
      return next;
    });
  };

  const renderPhoneStep = () => (
    <>
      <PhoneNumberField
        country={country}
        onCountryChange={setCountry}
        value={phoneInput}
        onValueChange={(value) => {
          setPhoneInput(value);
          setPhoneError(null);
        }}
        disabled={isSubmitting}
        error={phoneError}
      />

      {isDevFakePhoneInput(phoneInput, country) ? (
        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
          Dev mode: OTP for the fake PH number will be printed in Convex debug logs.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <Button
          type="button"
          onClick={() => {
            void requestOtp();
          }}
          isLoading={isSubmitting}
          className="w-full"
        >
          Continue with Phone
        </Button>
        <SocialLoginButtons />
      </div>

      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigate({ to: "/forgot-password" })}
          className="text-[var(--color-text-secondary)] transition-colors hover:text-white"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: alternateCta.to })}
          className="text-[var(--color-rose)] transition-colors hover:text-[var(--color-rose-light)]"
        >
          {alternateCta.label}
        </button>
      </div>
    </>
  );

  const renderOtpStep = () => (
    <>
      <div className="mb-4 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Enter the 6-digit code sent to
        </p>
        <p className="mt-1 font-semibold text-white">{normalizedPhone}</p>
      </div>

      <div className="mb-4 grid grid-cols-6 gap-2">
        {otpDigits.map((digit, index) => (
          <div
            key={index}
            className={`flex min-h-[48px] items-center justify-center rounded-xl border text-lg font-semibold transition-all ${
              digit
                ? "border-[var(--color-rose)] bg-[var(--color-rose)]/10 text-white"
                : "border-white/10 bg-[var(--color-drawer-item-bg)] text-[var(--color-text-secondary)]"
            }`}
          >
            {digit || "•"}
          </div>
        ))}
      </div>

      {otpError ? (
        <StatusMessage
          tone="error"
          message={otpError}
          compact
          className="mb-3"
        />
      ) : null}

      <OtpKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={isSubmitting} />

      <div className="mt-4 space-y-3">
        <Button
          type="button"
          onClick={() => {
            void verifyOtp();
          }}
          isLoading={isSubmitting}
          disabled={isSubmitting || otpValue.length !== 6}
          className="w-full"
        >
          Verify OTP
        </Button>

        <div className="flex items-center justify-between gap-2 text-sm">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("phone");
              setOtpError(null);
            }}
            disabled={isSubmitting}
            className="flex-1"
          >
            Change number
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void requestOtp();
            }}
            disabled={isSubmitting || !canResend}
            className="flex-1"
          >
            {canResend ? "Resend" : `Resend ${formatCountdown(resendAvailableAt ?? Date.now())}`}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <LoadingModal
        isOpen={isSignupTransitionLoading}
        title="Account created"
        subtitle="Finalizing your setup..."
        logoSrc="/eyymi-handmark.svg"
      />
      <div className="min-h-screen bg-[var(--color-navy-bg)] px-5 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[430px] flex-col items-center justify-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-rose)] text-2xl font-bold text-white shadow-[0_12px_40px_rgba(20,184,166,0.25)]">
            eyymi
          </div>
          <AuthCard title={title} subtitle={subtitle}>
            {step === "phone" ? renderPhoneStep() : renderOtpStep()}
          </AuthCard>
        </div>
      </div>
    </>
  );
}
