import { parsePhoneNumberFromString } from "libphonenumber-js";

export type SupportedCountry = "PH" | "US" | "SG" | "AE";

export const SUPPORTED_COUNTRIES: Array<{
  code: SupportedCountry;
  label: string;
  dialCode: string;
}> = [
  { code: "PH", label: "Philippines", dialCode: "+63" },
  { code: "US", label: "United States", dialCode: "+1" },
  { code: "SG", label: "Singapore", dialCode: "+65" },
  { code: "AE", label: "UAE", dialCode: "+971" },
];

export function normalizePhoneToE164(input: string, country: SupportedCountry = "PH"): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Phone number is required");
  }

  const parsed = trimmed.startsWith("+")
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, country);

  if (!parsed || !parsed.isValid()) {
    throw new Error("Please enter a valid phone number");
  }

  return parsed.number;
}

export function isDevFakePhoneInput(input: string, country: SupportedCountry = "PH"): boolean {
  try {
    return normalizePhoneToE164(input, country) === "+639948235631";
  } catch {
    return false;
  }
}
