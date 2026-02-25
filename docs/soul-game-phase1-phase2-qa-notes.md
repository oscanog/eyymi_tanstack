# Soul Game Phase 1 + Phase 2 MVP QA Notes

## Implemented Scope

- `/welcome` Soul Game card now routes to `/soul_game`
- `/soul_game` now joins queue, heartbeats, polls realtime state, and submits press start/end
- Inline statuses use user-friendly messages (no raw Convex error strings shown to users)
- Server-side match logic uses press interval overlap (Convex)
- 2-minute session payload/countdown is surfaced in UI when matched

## Validation Run (2026-02-25)

### Frontend (`d:\eyymi_tanstack`)

- `npm run typecheck` ✅
- `npm run build` ✅

### Backend (`d:\eyymi_backend_convex`)

- `npm run test -- convex/__tests__/soulGame.logic.test.ts` ✅
- `npm run typecheck` ✅
- `npm run codegen` ✅

## Manual Realtime QA Checklist (2 browser sessions)

1. Open Browser A and Browser B with different OTP auth sessions.
2. Complete onboarding username setup for both (if needed).
3. Open `/welcome` and tap `Soul game` on both.
4. Confirm both clients join queue and see queue count/candidate cards update.
5. Press in only one client for >600ms and release.
6. Confirm no match and queue remains active.
7. Press in both clients with overlapping hold windows (>=350ms overlap).
8. Confirm both clients show match/session success state and countdown starts.
9. Let countdown expire and confirm UI returns to idle/queue-ready state.
10. Tap `Leave queue` and confirm no immediate raw error is shown.

## Known MVP Risks / Follow-up

- Match race conditions are minimized but not fully hardened for simultaneous third-user contention.
- Session expiry is currently reflected via derived query state; background cleanup/hardening can be expanded.
- Candidate avatars use placeholder `CommunityAvatarIcon` rendering for MVP; dedicated Soul avatar icon components remain Phase 3.
- Onboarding avatar selector/random default (Phase 4) not implemented yet.
