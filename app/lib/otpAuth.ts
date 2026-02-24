/**
 * OTP auth session storage and helpers.
 * Separate from the mapping username/device local storage to keep migration risk low.
 */

const OTP_AUTH_KEYS = {
  sessionToken: "eyymi_auth_session_token",
  authUserId: "eyymi_auth_user_id",
  phoneE164: "eyymi_auth_phone_e164",
  expiresAt: "eyymi_auth_expires_at",
} as const;

const isBrowser = (): boolean => typeof window !== "undefined";

export interface OtpAuthSession {
  sessionToken: string;
  authUserId: string;
  phoneE164: string;
  expiresAt: number;
}

function read(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore local storage failures in MVP
  }
}

function remove(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore local storage failures in MVP
  }
}

export const otpAuthStorage = {
  getSession(): OtpAuthSession | null {
    const sessionToken = read(OTP_AUTH_KEYS.sessionToken);
    const authUserId = read(OTP_AUTH_KEYS.authUserId);
    const phoneE164 = read(OTP_AUTH_KEYS.phoneE164);
    const expiresAtRaw = read(OTP_AUTH_KEYS.expiresAt);

    if (!sessionToken || !authUserId || !phoneE164 || !expiresAtRaw) return null;
    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt)) return null;

    return { sessionToken, authUserId, phoneE164, expiresAt };
  },

  setSession(session: OtpAuthSession): void {
    write(OTP_AUTH_KEYS.sessionToken, session.sessionToken);
    write(OTP_AUTH_KEYS.authUserId, session.authUserId);
    write(OTP_AUTH_KEYS.phoneE164, session.phoneE164);
    write(OTP_AUTH_KEYS.expiresAt, String(session.expiresAt));
  },

  clear(): void {
    remove(OTP_AUTH_KEYS.sessionToken);
    remove(OTP_AUTH_KEYS.authUserId);
    remove(OTP_AUTH_KEYS.phoneE164);
    remove(OTP_AUTH_KEYS.expiresAt);
  },

  hasValidSession(): boolean {
    const session = this.getSession();
    if (!session) return false;
    return session.expiresAt > Date.now();
  },
};
