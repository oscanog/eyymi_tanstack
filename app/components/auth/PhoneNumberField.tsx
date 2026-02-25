import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  SUPPORTED_COUNTRIES,
  type SupportedCountry,
} from "@/lib/phoneNumber";

interface PhoneNumberFieldProps {
  country: SupportedCountry;
  onCountryChange: (country: SupportedCountry) => void;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function PhoneNumberField({
  country,
  onCountryChange,
  value,
  onValueChange,
  disabled,
  error,
}: PhoneNumberFieldProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-text-primary)]">
        Phone number
      </label>
      <div className="grid grid-cols-[120px_1fr] gap-1">
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value as SupportedCountry)}
          disabled={disabled}
          className="min-h-[56px] rounded-xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] px-3 text-sm text-white outline-none transition-colors focus:border-[var(--color-rose)]"
          aria-label="Country"
        >
          {SUPPORTED_COUNTRIES.map((item) => (
            <option key={item.code} value={item.code} className="bg-[#111827] text-white">
              {item.code} {item.dialCode}
            </option>
          ))}
        </select>
        <Input
          type="tel"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={
            country === "PH"
              ? "9XX XXX XXXX"
              : "Enter phone number"
          }
          disabled={disabled}
          error={Boolean(error)}
          autoComplete="tel"
          inputMode="tel"
        />
      </div>
      {error ? <StatusMessage tone="error" message={error} compact /> : null}
    </div>
  );
}
