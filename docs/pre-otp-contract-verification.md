# Pre-OTP Backend Contract Verification (Phase 1/2)

Date: 2026-02-24
Scope: Compare frontend Convex endpoint stub (`app/lib/convexAPI.ts`) with exported Convex public functions in `d:\eyymi_backend_convex\convex` before OTP integration.

## Result Summary

- Backend mapping modules ported and test wiring works (Vitest restricted to `convex/__tests__`).
- Backend runtime naming normalization started: `convex/health.ts` service string changed from `man2man-api` to `eyymi-api`.
- Contract is mostly aligned for core mapping flows, with a small number of stub mismatches to resolve before broader frontend usage.

## Frontend Stub Endpoints (from `app/lib/convexAPI.ts`)

- `locations/getBothLocations`
- `locations/getHistory`
- `locations/getMyLocation`
- `locations/getPartnerLocation`
- `locations/update`
- `locationSessions/close`
- `locationSessions/create`
- `locationSessions/get`
- `locationSessions/getActiveForUser`
- `locationSessions/getAllActive`
- `locationSessions/getByCode`
- `locationSessions/join`
- `users/getByDevice`
- `users/getOnlineUsers`
- `users/heartbeat`
- `users/setOffline`
- `users/upsert`

## Backend Exported Public Endpoints (queries/mutations/actions)

- `health/check`
- `invites/cancel`
- `invites/getIncomingPendingForUser`
- `invites/getLatestOutgoingForUser`
- `invites/respond`
- `invites/send`
- `locations/getMyLocation`
- `locations/getPartnerLocation`
- `locations/getSessionLocations`
- `locations/update`
- `locationSessions/close`
- `locationSessions/create`
- `locationSessions/get`
- `locationSessions/getActiveForUser`
- `locationSessions/getAllActive`
- `locationSessions/getByCode`
- `locationSessions/getParticipantState`
- `locationSessions/hasPartnerJoined`
- `locationSessions/join`
- `meetingPlaces/getForSession`
- `meetingPlaces/requestRemoval`
- `meetingPlaces/respondRemoval`
- `meetingPlaces/searchSuggestions`
- `meetingPlaces/setMeetingPlace`
- `routes/getForSession`
- `routes/getForSessionRoutes`
- `routes/recomputeFastestRoad`
- `users/get`
- `users/getByDevice`
- `users/getOnlineUsers`
- `users/heartbeat`
- `users/setOffline`
- `users/upsert`

## Mismatches (Frontend stub references not found as backend public exports)

- `locations/getBothLocations`
- `locations/getHistory`

## Backend Public Endpoints Not Represented in Frontend Stub

- `health/check`
- `invites/cancel`
- `invites/getIncomingPendingForUser`
- `invites/getLatestOutgoingForUser`
- `invites/respond`
- `invites/send`
- `locations/getSessionLocations`
- `locationSessions/getParticipantState`
- `locationSessions/hasPartnerJoined`
- `meetingPlaces/getForSession`
- `meetingPlaces/requestRemoval`
- `meetingPlaces/respondRemoval`
- `meetingPlaces/searchSuggestions`
- `meetingPlaces/setMeetingPlace`
- `routes/getForSession`
- `routes/getForSessionRoutes`
- `routes/recomputeFastestRoad`
- `users/get`

## Important Contract Notes (Observed in Code)

- Frontend hooks often call Convex paths using `module:function` syntax (example: `locationSessions:create`) directly via `app/lib/convex.ts`, while the stub file uses `module/function` strings. The HTTP client currently sends the path as-is (no normalization), so path format must be standardized before OTP integration.
- `app/lib/convexAPI.ts` includes `locations/getHistory` and `locations/getBothLocations`, but backend `convex/locations.ts` currently exports `getSessionLocations` instead. These stub entries appear unused by the current frontend code, but should be reconciled before expanding location history features.
- `convex/sessions.ts` re-exports `./locationSessions` and exists as a compatibility alias module.

## Recommended Pre-OTP Follow-Ups

1. Standardize Convex path format across frontend (`:` vs `/`) and update one canonical helper.
2. Align or remove unused stub endpoints (`locations/getHistory`, `locations/getBothLocations`).
3. Regenerate Convex `_generated/*` after schema/function stabilization and verify endpoint references against generated API if type-safe integration is adopted.
