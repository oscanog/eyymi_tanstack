import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { PhoneNumberField } from "@/components/auth/PhoneNumberField";
import type { SupportedCountry } from "@/lib/phoneNumber";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [country, setCountry] = useState<SupportedCountry>("PH");
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[430px] flex-col items-center justify-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-rose)] text-2xl font-bold text-white shadow-[0_12px_40px_rgba(20,184,166,0.25)]">
          eyymi
        </div>
        <AuthCard
          title="Forgot password"
          subtitle="Placeholder recovery route. Phone recovery flow will be added after OTP auth gate MVP."
        >
          <PhoneNumberField
            country={country}
            onCountryChange={setCountry}
            value={phone}
            onValueChange={setPhone}
            error={null}
          />

          <StatusMessage
            tone="info"
            message="Placeholder only for now. Recovery flow will use phone OTP."
            className="mt-4"
          />

          <div className="mt-5 space-y-3">
            <Button type="button" className="w-full" disabled>
              Continue (Coming Soon)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate({ to: "/signin" })}
            >
              Back to Sign in
            </Button>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
