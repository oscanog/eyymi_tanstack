# EYYMI OTP Auth Gate Execution Plan (MVP)

Status: Draft v1 (plan-first)
Date: 2026-02-25
Scope: Add auth gate + OTP phone auth UX/backend for EYYMI before Twilio integration.

## Goal

Implement an auth-gated EYYMI app with:

1. `signin` page (phone + OTP)
2. `signup` page (phone + OTP)
3. `forgot-password` page (placeholder)

Requirements from request:

- Phone number auth with OTP
- Philippines default country selector
- Robust handling for `+639948235631` and `09948235631`
- Dev mode fake OTP flow using fake number `+639948235631`
- OTP pin visible in Convex debug logs in development only
- Twilio integration deferred (add clear TODO comments)
- Social login placeholder buttons (`Facebook`, `Gmail`)
- Placeholder links/buttons for `Forgot password` and `Doesn't have account yet`
- Nice modern OTP keypad UI with press animations
- Best-practice OTP backend/security patterns

Primary schema reference:
- `../eyymi_backend_convex/docs/phone-auth-minimal-schema.md`

## Senior Agent Workstreams (Spawned)

### Agent A: Auth Architecture / Security (Backend Lead)

Responsibilities:
- Translate OTP schema spec into Convex tables + indexes
- Implement OTP challenge + verification + session lifecycle
- Enforce OTP security rules (hashing, expiry, attempts, cooldown, consume-on-use)
- Design SMS provider abstraction with dev fake provider and Twilio TODOs

Deliverables:
- Convex schema updates
- `auth/*` or equivalent Convex modules
- Tests for OTP and session flows
- Security checklist

### Agent B: Frontend Auth Gate / Route Integration (App Lead)

Responsibilities:
- Add auth routes (`/signin`, `/signup`, `/forgot-password`)
- Implement route guards for `/session` and `/map/*`
- Session bootstrap/restore/logout handling
- Transition away from current anonymous username-only onboarding entry

Deliverables:
- Route changes and guard logic
- Auth storage/session client helpers
- Placeholder social login UI wiring (no real OAuth yet)

### Agent C: Senior UI/UX Auth Experience (UI/UX Lead)

Responsibilities:
- Design and implement polished phone + OTP screens
- Add phone number country picker (PH default)
- Build animated OTP keypad and input interactions
- Ensure mobile-first accessibility and reduced-motion support

Deliverables:
- Auth screen layout system
- Animated OTP keypad component
- Interaction specs for validation/error/loading states

### Agent D: QA / Release Verification (QA Lead)

Responsibilities:
- Verify auth flows in dev mode (fake OTP)
- Validate route gate behavior
- Run build/test/typecheck for frontend/backend
- Document known gaps before Twilio production integration

Deliverables:
- QA matrix and run log
- Sign-off for MVP auth gate

## Recommended Libraries (Frontend)

Use these (recommended):

- `react-phone-number-input`
  - Good country selector support
  - Works well with `libphonenumber-js`
- `libphonenumber-js`
  - Parse/validate/format E.164 robustly
  - Set default country to `PH`

Optional UI helper (only if needed):
- `react-otp-input` (not required if custom keypad is built)

Recommendation:
- Use `libphonenumber-js` validation + custom OTP keypad UI (better control for UX)

## Phone Number Rules (PH Robust Handling)

Accepted user input examples (Philippines):

- `+639948235631` (E.164) -> keep as-is
- `09948235631` -> normalize to `+639948235631`
- `9948235631` -> normalize to `+639948235631` (when PH selected)

Normalization plan:

1. Trim spaces, hyphens, parentheses
2. If `+` present, parse with `libphonenumber-js`
3. If no `+`, use selected country (`PH` default) to parse
4. Persist only E.164 in backend
5. Reject invalid or unsupported numbers with clear UI error

## Auth UX Routes (Phase 1 Frontend)

### 1. `/signin`

UI sections:
- Phone input with country dropdown (default `PH`)
- Continue button
- Placeholder buttons:
  - `Continue with Facebook`
  - `Continue with Gmail`
- Links/placeholders:
  - `Forgot password?`
  - `Doesn't have an account yet? Sign up`

Behavior:
- Enter phone -> request OTP challenge
- Navigate to OTP step (same route state or nested route/modal/panel)

### 2. `/signup`

UI sections:
- Same phone input and country picker
- Continue button
- Placeholder social buttons (same styling)
- Link to sign in

Behavior:
- Request OTP for signup purpose
- Continue to OTP verification

### 3. `/forgot-password`

Placeholder page (for now):
- Phone number field + country picker
- Text explaining “Coming soon / recovery flow placeholder”
- Continue button disabled or placeholder action

Note:
- Since current MVP is phone OTP, this route can later become “account recovery by phone”

## OTP Input UX (Senior UI/UX Spec)

### UI Structure

- 6-digit OTP display slots (large, centered)
- Numeric keypad (0-9) + backspace
- Press animation:
  - scale-down on tap (`active:scale-[0.96]`)
  - subtle highlight pulse on key press
- Resend timer chip (`Resend in 30s`)
- Error/feedback states:
  - invalid OTP
  - expired OTP
  - too many attempts

### UX Requirements

- Auto-advance digit slots on keypad press
- Backspace removes last digit
- Disable verify button until 6 digits
- Optional paste support for desktop (future-friendly)
- Reduced motion support:
  - disable pulse/transform animations if `prefers-reduced-motion`

### Visual Direction

- Keep current EYYMI aurora-mint + midnight-neon palette
- Reuse centralized button styles for keypad and actions
- Introduce a reusable `AuthCard` container and `KeypadButton` component

## Auth Gate Integration Plan

Current app behavior:
- Username onboarding route currently allows entry into session features

Target behavior:
- `/session*` and `/map/*` require authenticated OTP session
- Unauthenticated users redirect to `/signin`
- Existing onboarding username route becomes:
  - deprecated / removed, or
  - converted into profile setup after auth (recommended later)

### Route Guard Strategy (TanStack)

Phase 1 (MVP):
- Add auth state helper (`isAuthenticated`, `getSession`, `logout`)
- Guard in route `beforeLoad` or client-side gate for:
  - `/session`
  - `/session/*`
  - `/map/$sessionId`
- Redirect to `/signin?redirect=...`

Phase 2:
- Server-aware session validation / refresh token rotation support

## Backend OTP Implementation Plan (Convex)

## Schema (Convex adaptation of SQL doc)

Add/extend tables in `../eyymi_backend_convex/convex/schema.ts`:

1. `users` (extend existing mapping users table)
- Add phone auth fields:
  - `phoneE164?: string`
  - `phoneVerifiedAt?: number`
  - `accountStatus?: "active" | "blocked" | "deleted"`
  - `lastLoginAt?: number`

Important:
- Preserve existing mapping fields (`deviceId`, `username`, etc.)
- This avoids breaking current mapping logic while auth is added

2. `phoneOtpChallenges`
- `phoneE164`
- `otpCodeHash`
- `purpose` (`signin` | `signup` | `reverify`)
- `status`
- `attemptCount`
- `maxAttempts`
- `resendCount`
- `expiresAt`
- `verifiedAt?`
- `consumedAt?`
- `providerMessageId?`
- `ipAddress?`
- `deviceId?`
- timestamps

3. `authSessions`
- `userId`
- `refreshTokenHash`
- `deviceId?`
- `platform?`
- `appVersion?`
- `ipAddress?`
- `userAgent?`
- `createdAt`
- `lastSeenAt?`
- `expiresAt`
- `revokedAt?`

## Convex Modules (suggested)

Create new modules:

- `convex/authOtp.ts`
  - `requestCode` (mutation/action)
  - `verifyCode` (mutation)
- `convex/authSessions.ts`
  - `refresh`
  - `logout`
  - `getCurrentSession`
- `convex/authUsers.ts` (optional)
  - profile/session-safe auth user fetch helpers

Keep comments for future provider integration:
- `// TODO(twilio): send SMS via Twilio Verify or Messaging API here`

## OTP Security Best Practices (Required)

- Never store plaintext OTP in DB
- Hash OTP with a strong hash (`SHA-256/HMAC` or stronger strategy + server pepper)
- OTP expiry default: 5 minutes
- Max attempts default: 5
- Resend cooldown: 30-60s
- Mark challenge `consumed` after successful login to prevent replay
- Log raw OTP only in development and only for fake/dev provider flow
- Do not log raw OTP in production
- Generic user-facing errors (avoid revealing account existence unnecessarily)

## Dev Fake OTP Mode (Required for MVP)

### Fake Number

Use fake number:
- `+639948235631`

Handle raw local form too:
- `09948235631` -> normalize to `+639948235631`

### Behavior in Development

If app/backend is running in dev mode:

- `requestCode` accepts fake number and generates OTP
- OTP is logged in Convex logs (debug only)
- SMS provider call is skipped

Log example:
- `[otp.dev] phone=+639948235631 code=123456 challengeId=...`

Guardrails:
- Only enable OTP logging when dev environment is true
- Comment code clearly:
  - `// DEV ONLY: log OTP for local testing`
  - `// TODO(twilio): replace fake provider with Twilio sender`

## Twilio Integration (Deferred, but prepared)

Do not implement now, but plan adapter interface:

- `sendOtpSms({ phoneE164, code, purpose })`

Implementations:
- `DevFakeSmsProvider`
- `TwilioSmsProvider` (placeholder class/function with TODO comments)

Benefits:
- Easy swap when Twilio keys are ready
- Keeps OTP core logic independent from vendor

## Frontend Auth Components (DRY / Centralized)

Create reusable UI building blocks under `app/components/auth/`:

- `AuthLayoutCard.tsx`
- `PhoneNumberField.tsx`
  - wraps country selector + input
  - uses `libphonenumber-js`
- `OtpCodeSlots.tsx`
- `OtpKeypad.tsx`
  - animated numeric keys
- `AuthFooterLinks.tsx`
  - forgot password / signup / signin links placeholders
- `SocialLoginButtons.tsx`
  - placeholder FB / Gmail buttons

This keeps sign-in/sign-up/forgot pages consistent and DRY.

## Phased Execution Plan

### Phase 0: Planning + Route Strategy Freeze (This doc)

Exit criteria:
- Auth routes and gate approach approved
- Dev fake OTP behavior approved
- Library choices approved

### Phase 1: Backend OTP Foundation (Convex)

Tasks:
- Extend schema with OTP/session tables
- Implement request/verify/session mutations
- Implement dev fake OTP provider + Convex debug logs
- Add TODO comments for Twilio integration
- Add tests

Exit criteria:
- Backend OTP flow works via direct calls (fake number in dev)

### Phase 2: Frontend Auth UI/UX (Senior UI/UX pass)

Tasks:
- Implement `/signin`, `/signup`, `/forgot-password`
- Phone country picker (PH default)
- OTP keypad UI and animated interactions
- Placeholder social and forgot/signup links/buttons

Exit criteria:
- User can request and enter OTP in UI

### Phase 3: Auth Gate Integration

Tasks:
- Add auth storage/session helpers
- Guard `/session*` and `/map/*`
- Redirect unauthenticated users to `/signin`
- Preserve intended destination via `redirect` param

Exit criteria:
- Session and map routes blocked when unauthenticated

### Phase 4: Dev Validation + QA

Tasks:
- Validate fake number flow (`+639948235631`, `09948235631`)
- Confirm OTP visible in Convex debug logs (dev only)
- Verify sign-in/sign-up placeholder flows and route navigation
- Regression test mapping routes after auth gate

Exit criteria:
- Frontend + backend QA checks pass

## QA Verification Matrix (Auth MVP)

Backend (`d:\eyymi_backend_convex`):
- `npm run typecheck`
- `npm test`
- `npx convex dev`
- Manual:
  - request OTP for fake PH number
  - verify OTP
  - create session token
  - ensure OTP shown only in dev logs

Frontend (`d:\eyymi_tanstack`):
- `npm run typecheck`
- `npm test`
- `npm run build`
- Manual:
  - `/signin` phone input validates PH numbers
  - `09948235631` normalizes to `+639948235631`
  - OTP keypad animations work
  - social buttons visible placeholders
  - forgot/signup links visible placeholders
  - auth gate redirects `/session` -> `/signin` when logged out

## Open Decisions (Need Confirmation Before Implementation)

1. OTP expiry window: `5 minutes` (recommended)
2. Max attempts: `5` (recommended)
3. Refresh session expiry: `30 days` (recommended MVP)
4. Sign-up behavior:
- Create account immediately after OTP verify (recommended)
5. Username flow:
- Keep current username capture after OTP as a separate profile step (recommended)
- Or remove username concept now (not recommended until mapping/invite UX is updated)

## Immediate Next Step (After Plan Approval)

Start Phase 1 backend implementation first:
- schema + `authOtp` / `authSessions` modules
- dev fake OTP provider
- tests

Then Phase 2 UI/UX auth screens and OTP keypad, followed by Phase 3 route gate.
