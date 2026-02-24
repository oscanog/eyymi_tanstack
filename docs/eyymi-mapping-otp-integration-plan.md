# EYYMI Mapping Reuse + OTP Auth Integration Plan

Status: Draft v1 (implementation plan)
Owner: Migration lead (you) + senior agent workstreams
Date: 2026-02-24

## Goal

Reuse the working mapping system from `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first` into:

- `../eyymi_backend_convex` (Convex backend target)
- `./` (`d:\eyymi_tanstack`, TanStack frontend target)

Then add OTP phone auth schema/functionality for the new `eyymi` app using the spec in `../eyymi_backend_convex/docs/phone-auth-minimal-schema.md`.

Note: The reference app stays intact during migration. Manual deletion of `reference_map_complete_tanstack_mobile_first` happens only after cutover verification is complete.

## Migration Strategy (High Level)

- Treat `reference_map_complete_tanstack_mobile_first` as a read-only source of truth.
- Port backend and frontend in parallel after a contract freeze on shared function names/data shapes.
- Add OTP auth as a separate phase after mapping parity is stable (to reduce debugging overlap).
- Gate each phase with QA checks (`npm run build`, tests, typecheck, smoke flows).

## Senior Agent Workstreams (Parallel)

### Agent A: Migration Coordinator / Contracts

Responsibilities:
- Define source-to-target file mapping and naming conventions (`man2man` -> `eyymi`).
- Freeze shared backend/frontend contracts before parallel implementation.
- Track cutover checklist and blockers.

Deliverables:
- File migration checklist
- Shared contract doc (function names, payload shapes, env vars)
- Phase sign-off notes

### Agent B: Backend Mapping Port (Convex)

Responsibilities:
- Port mapping-related Convex schema and functions from reference backend.
- Preserve behavior parity for sessions, locations, routes, meeting places, invites, health/crons.
- Re-enable backend tests and type checks in `../eyymi_backend_convex`.

Primary source paths:
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/backend/convex/*`
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/backend/package.json`

Target paths:
- `../eyymi_backend_convex/convex/*`
- `../eyymi_backend_convex/package.json`

### Agent C: Frontend Mapping Port (TanStack)

Responsibilities:
- Scaffold `d:\eyymi_tanstack` from the reference TanStack app and adapt naming/config.
- Port map/session/invite UI, routes, stores, hooks, and styles.
- Wire frontend to target Convex backend and confirm mobile-first behavior.

Primary source paths:
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/app/*`
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/public/*`
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/package.json`
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/vite.config.ts`
- `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first/tsconfig.json`

Target paths:
- `./app/*`, `./public/*`, `./package.json`, `./vite.config.ts`, `./tsconfig.json`

### Agent D: OTP Auth Backend + Client Integration

Responsibilities:
- Translate the SQL-oriented OTP schema spec into Convex tables/indexes/functions.
- Implement phone OTP challenge lifecycle and session persistence.
- Integrate frontend phone auth screens/flows and guard mapping access behind session state.

Primary spec:
- `../eyymi_backend_convex/docs/phone-auth-minimal-schema.md`

### Agent E: QA / Release Verification

Responsibilities:
- Run phase gates and final regression matrix.
- Validate build/test/typecheck and smoke flows on both repos.
- Produce cutover sign-off and cleanup approval for manual reference-folder deletion.

## Phase Plan

### Phase 0: Baseline + Contract Freeze (Required before parallel porting)

Objectives:
- Inventory the reference app features to port (mapping MVP only).
- Confirm target naming (`eyymi`) and env variable names.
- Define the backend/frontend contract snapshot to avoid drift.

Tasks:
- List reference Convex functions used by the frontend (`users`, `locationSessions`, `locations`, `routes`, `meetingPlaces`, `invites`, `health`, `crons` as applicable).
- Record data shapes used by the UI (session status, route status, meeting-place status, invite status).
- Decide what is intentionally deferred (non-mapping extras, Flutter docs artifacts, etc.).
- Normalize package scripts in both targets so QA commands are stable.

Exit criteria:
- Contract checklist approved.
- Target script checklist created (including `build`, `test`, `typecheck` where applicable).

### Phase 1: Port Backend Mapping System into `eyymi_backend_convex`

Objectives:
- Achieve backend parity for the existing mapping/session flows before auth changes.

Tasks:
- Copy/adapt `backend/convex` modules from reference into `../eyymi_backend_convex/convex`.
- Port schema entries from reference `backend/convex/schema.ts` into target schema.
- Port tests under `backend/convex/__tests__` and supporting config (`vitest`, `tsconfig`, scripts).
- Update naming/branding strings and env references (`man2man` -> `eyymi`).
- Run Convex codegen and verify generated types update cleanly.

Risks / notes:
- Avoid editing generated files manually (`convex/_generated/*`).
- Keep schema changes incremental to simplify debugging.

Exit criteria:
- Target backend compiles/typechecks.
- Backend tests pass.
- Mapping functions callable in local Convex dev environment.

### Phase 2: Port TanStack Frontend Mapping System into `eyymi_tanstack`

Objectives:
- Recreate the working mapping UI/flows in the new frontend repo with target backend wiring.

Tasks:
- Scaffold project files from reference (`app`, `public`, config files, package manifests).
- Adapt env/config endpoints to `eyymi_backend_convex` deployment/dev settings.
- Validate route generation/build pipeline (TanStack route tree, Vite build).
- Rename app text/assets where needed to `eyymi`.
- Verify mobile-first layout behavior on key screens (session create/join/map).

Exit criteria:
- `npm run build` passes in `d:\eyymi_tanstack`.
- Frontend tests pass (or documented gaps with immediate follow-up).
- Manual smoke test reaches map flow against local backend.

### Phase 3: Integration Parity Pass (Mapping End-to-End)

Objectives:
- Confirm mapping system works end-to-end in the new repo split before OTP auth is introduced.

Tasks:
- Run paired local env (`eyymi_backend_convex` + `eyymi_tanstack`).
- Verify create/join session flow, location updates, route generation, meeting-place selection, invite flow.
- Capture defects and fix parity regressions before auth work begins.

Exit criteria:
- Mapping parity checklist signed off.
- No critical regressions in core session/map flows.

### Phase 4: OTP Auth Schema Translation + Backend Implementation (`eyymi_backend_convex`)

Objectives:
- Add minimal OTP auth to the backend using the documented MVP schema, adapted for Convex.

Tasks:
- Translate SQL tables from `phone-auth-minimal-schema.md` into Convex tables/indexes:
  - `users` (extend or reconcile with mapping `users` table)
  - `phoneOtpChallenges` (Convex naming style recommended)
  - `authSessions`
- Resolve `users` table merge strategy:
  - Existing mapping user fields (`deviceId`, `username`, presence fields)
  - New phone auth fields (`phone_e164`, `phone_verified_at`, status/session linkage)
- Implement backend functions/actions for:
  - request OTP challenge
  - verify OTP challenge
  - create/rotate/revoke session
  - get current auth session / user profile
- Implement OTP hashing and challenge replay prevention (`verified` -> `consumed`).
- Add rate limiting / cooldown enforcement (MVP minimal enforcement accepted).
- Add tests for expiry, max attempts, resend cooldown, session creation, replay prevention.

Important design checkpoint:
- Decide whether mapping guest/device users are migrated into authenticated users or remain a temporary pre-auth state.

Exit criteria:
- Auth schema and functions implemented with tests.
- No regression to mapping schema/function behavior.

### Phase 5: Frontend OTP Flow Integration (`eyymi_tanstack`)

Objectives:
- Add phone auth UX and session state integration without breaking mapping flow.

Tasks:
- Add screens/components for phone entry, OTP entry, resend state, error handling.
- Normalize/validate phone input to E.164 (frontend UX + backend authoritative normalization).
- Persist session tokens securely (per current app strategy) and restore session on app load.
- Add route guards or startup checks for protected mapping routes.
- Wire logout/session expiry handling.

Exit criteria:
- User can request OTP, verify OTP, and enter mapping flow with an active session.
- Expired/invalid OTP and cooldown UX handled correctly.

### Phase 6: QA Hardening + Release Readiness

Objectives:
- Run final verification matrix across both repos and capture remaining issues.

Tasks:
- Run build/test/typecheck in both repos.
- Run end-to-end smoke tests for mapping + OTP flows.
- Validate error states (expired OTP, max attempts, revoked session, backend unavailable).
- Confirm documentation updates for env/setup commands.

Exit criteria:
- QA matrix complete with pass/fail notes.
- Remaining issues are only non-blocking and tracked.

### Phase 7: Cutover + Reference Cleanup (User Manual Delete)

Objectives:
- Freeze the new implementation as source of truth and retire the reference copy.

Tasks:
- Confirm no imports/scripts still point into `reference_map_complete_tanstack_mobile_first`.
- Tag/commit both target repos after passing QA.
- User manually deletes `../eyymi_backend_convex/reference_map_complete_tanstack_mobile_first`.

Exit criteria:
- Targets are self-contained.
- Reference folder no longer required.

## QA Verification Matrix (Required)

### A. `../eyymi_backend_convex` (Convex backend)

Preconditions:
- Dependencies installed
- Env configured (`.env.local` / Convex env as needed)

Required commands (target state):
- `npm install`
- `npm run typecheck`
- `npm test`
- `npx convex codegen`

Manual smoke:
- `npx convex dev`
- Verify core mapping functions respond
- Verify OTP request/verify/session functions respond

Notes:
- Current `../eyymi_backend_convex/package.json` is minimal; Phase 0/1 should add scripts (`typecheck`, `test`, optionally `dev`) to match the verification workflow.

### B. `d:\eyymi_tanstack` (TanStack frontend)

Preconditions:
- Dependencies installed
- Frontend env points to target Convex backend/dev deployment

Required commands (target state):
- `npm install`
- `npm run build`
- `npm test`
- `npm run typecheck` (recommended add if missing)

Manual smoke:
- `npm run dev`
- Verify mobile-first map UI renders
- Verify create/join session flow
- Verify OTP login flow (request, verify, resend cooldown, error states)

### C. End-to-End Regression Checklist

Core mapping:
- Create session
- Join session by code
- Live location updates for both users
- Route generation/update lifecycle
- Meeting place set/remove flow
- Invite send/accept/decline flow (if included in MVP cut)

OTP auth:
- New user phone verification path
- Returning user login path
- Invalid OTP handling
- Expired OTP handling
- Max attempts lockout behavior
- Resend cooldown behavior
- Session refresh/restore/logout

Non-functional:
- No console/runtime errors during happy path
- App builds from clean install
- Convex schema/codegen succeeds without manual edits to generated files

## Key Technical Decisions To Lock Early

1. `users` merge model in Convex
- Single `users` table extended with phone auth fields (recommended for MVP)
- Avoid split identity/profile tables unless required immediately

2. Auth before/after mapping access
- Require OTP before creating/joining mapping sessions (simpler long term)
- Or allow guest mapping then upgrade to OTP (more complex migration logic)

3. Session token handling in frontend
- Exact storage strategy (local storage/cookie/native secure storage wrapper) must be consistent with app platform targets

4. OTP provider integration timing
- Stub/mock provider first for dev + tests, real SMS provider in a follow-up subphase if not ready

## Dependencies / Sequencing Summary

- Phase 0 must finish before Agents B/C/D run in parallel.
- Phase 1 and Phase 2 can run in parallel after contract freeze.
- Phase 3 must pass before Phase 4 starts (recommended to isolate regressions).
- Phase 4 backend auth work should stabilize before Phase 5 frontend auth work completes.
- Phase 6 is mandatory before Phase 7 cleanup.

## Deliverables (What “Implemented Plan” Means)

- This plan doc in `d:\eyymi_tanstack\docs`
- File migration checklist (can be added as a follow-up doc)
- Contract snapshot for backend/frontend functions and payloads
- QA run log for both repos

## Suggested Next Execution Step

Start Phase 0 by generating a file-level migration checklist from the reference app (source -> target path mapping) and adding missing scripts in `../eyymi_backend_convex/package.json` and the new `d:\eyymi_tanstack/package.json` scaffold.
