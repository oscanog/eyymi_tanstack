# Realtime Soul Game Implementation Plan (EYYMI)

## Goal

Build a realtime "Soul Game" experience that starts from the `/welcome` page and routes to `/soul_game`, where two users can match by pressing a bottom circular button within the same timing window, then start a 2-minute conversation session.

This plan also covers:

- rotating avatar choices in the matching UI
- reusable monster/cartoon avatar assets
- onboarding step 4 (avatar selector)
- default randomized placeholder avatar assignment for new users
- dark/light theme consistency using the current EYYMI design system

## Product Summary (Target Behavior)

1. User taps `Soul game` on `/welcome`
2. User is routed to `/soul_game`
3. User sees rotating avatar candidates and a large bottom circular press button
4. If 2 users press within the required shared timing window, a match success animation appears
5. Success text example:
   - `"@user1 eyy to you, beginning your 2-minute conversation session"`
6. Avatar focus in the middle rotates every `5s` through available online users
7. A 2-minute conversation session starts after successful match

Testing requirement:

- Minimum `2 browsers / 2 devices / 2 tabs (separate sessions)` to validate realtime matching behavior

## Scope Split (Recommended)

### Phase 1 (MVP Realtime Match)

- `/welcome` Soul Game card click routes to `/soul_game`
- `/soul_game` UI shell
- Realtime queue/presence
- Press-and-hold timing capture
- Match detection within shared time window
- Match success animation + text
- 2-minute session creation (placeholder session payload allowed first)

### Phase 2 (Avatar Rotation + Selector)

- 10 Soul Game avatar characters (reusable icons/assets)
- Candidate rotation every `5s`
- 20 onboarding avatar placeholders (selectable)
- 4th onboarding modal (avatar selection)
- Random default avatar assignment for new signup

### Phase 3 (Hardening + UX polish)

- Fairness rules / anti-spam
- disconnect handling
- retry states
- queue estimates
- performance + QA matrix

## Architecture (High-Level)

## Frontend Routes

- `/welcome`
  - static placeholder today -> add click handler on `Soul game`
- `/soul_game`
  - new realtime matching page
- `/session` or future conversation route
  - receives 2-minute match session data after success

## Backend (Convex) - Proposed Modules

- `convex/soulGamePresence.ts`
  - user enters/leaves queue
  - heartbeat / online status
- `convex/soulGameMatch.ts`
  - press start / press end timestamps
  - match-window evaluation
  - match creation
  - success state broadcast/query
- `convex/soulGameSessions.ts`
  - 2-minute conversation session records
  - start/end timestamps
- `convex/soulGameAvatars.ts` (optional later)
  - avatar catalog + user avatar assignment

## Proposed Realtime Data Model (MVP)

### Tables (Convex)

- `soulGameQueue`
  - `authUserId`
  - `mappingUserId` (optional if username created)
  - `avatarId`
  - `isActive`
  - `joinedAt`
  - `lastHeartbeatAt`
- `soulGamePressEvents`
  - `queueUserId`
  - `pressStartedAt`
  - `pressEndedAt`
  - `durationMs`
  - `status` (`pending`, `matched`, `expired`)
- `soulGameMatches`
  - `userA`
  - `userB`
  - `matchWindowStart`
  - `matchWindowEnd`
  - `createdAt`
  - `status` (`pending_intro`, `active_2min`, `ended`, `cancelled`)
  - `conversationEndsAt`
- `userAvatarProfiles` (or extend existing auth profile table later)
  - `authUserId`
  - `avatarId`
  - `updatedAt`

## Matching Rule (MVP Recommendation)

Use server timestamps only.

- User presses button -> frontend sends `pressStart`
- User releases button -> frontend sends `pressEnd`
- Backend computes `durationMs` and overlap window
- Match happens if:
  - both users are active in queue
  - both press intervals overlap by at least `MIN_OVERLAP_MS` (e.g. `300-500ms`)
  - both durations meet minimum threshold (e.g. `>= 500ms`)
  - both not already matched

Why this is best practice:

- reduces client time cheating
- deterministic server-side decisions
- easier QA and replay/debugging

## UI/UX Requirements (Soul Game Page)

### Layout

- top bar (`Soul game`, back/close)
- rotating avatar strip / center focus avatar
- matching status text
- queue estimate text (placeholder okay first)
- large bottom circular press button (primary interaction)

### Button Interaction

- default: large circle button
- while pressing: grows with smooth scale + glow
- when both users overlap in time:
  - circle grows bigger
  - pulse / wave animation
  - success transition into match state

### Match Success Animation

- modal/banner overlay (unclosable for short intro)
- mint glow + subtle particles/rings (theme-safe)
- text example:
  - `@username eyy to you, beginning your 2-minute conversation session`
- CTA optional for MVP:
  - auto-transition after `0.8s - 1.2s`

### Candidate Rotation

- middle highlighted avatar changes every `5s`
- rotation source = available online queued users
- fairness:
  - cycle through all before repeating
  - skip self
  - skip recently shown users for a short cooldown (optional phase 2+)

## Avatar System (Reusable / DRY)

## Centralized Reusable Folder

Use centralized reusable assets/components:

- `app/components/icons/` (already established)
- Add:
  - `app/components/icons/soul-avatars/`
  - `app/components/icons/soul-avatars/index.ts`

## Avatar Counts

- `10` soul game character avatars (monster/cartoon/weird styles)
- `20` onboarding placeholder avatars (for new users)

## Data Placement (As Requested)

All static data for now should live in:

- `data/*`
- with `data/index.ts`

Suggested files:

- `data/soul-game.ts`
  - timing config, queue texts, static copy
- `data/avatars.ts`
  - 10 soul game avatars + 20 profile avatars metadata
- `data/index.ts`
  - exports all

## Onboarding Update (Step 4)

Current signup onboarding has 3 steps.

Add Step 4:

- Avatar selection step with modern scrollable selector
- show 20 placeholders in a grid/scroll sheet
- user can confirm/change before finishing

### UX Best Practices

- preselect a random avatar automatically on first load
- random assignment should avoid immediate repeats (client-side pool strategy for MVP)
- allow easy override before finishing
- large tap targets and visible selected state
- dark/light mode friendly selection ring and focus outline

### Persistence (MVP)

- Store selected avatar in local state during onboarding
- Save to backend once username is created (or store locally temporarily if backend profile table not ready yet)

## New Welcome Page Integration

Current `/welcome` is static placeholder.

Next step:

- Make `Soul game` card clickable
- Route to `/soul_game`
- Other cards/buttons remain static placeholders for now

## QA / Verification Plan

## Manual Realtime QA (Required)

Use 2 browsers/devices:

1. Open user A in Browser 1
2. Open user B in Browser 2 (different OTP auth + user)
3. Navigate both to `/soul_game`
4. Verify queue presence appears and candidate rotation updates every `5s`
5. Press button at different times -> should not match
6. Press within overlap window -> should match
7. Verify success animation appears on both
8. Verify 2-minute session state starts and countdown works
9. Verify session ends automatically at 2 minutes
10. Verify cleanup / retry path returns users safely

## Automated / Build QA

- `npm run typecheck` (frontend) ✅ required
- `npm run build` (frontend) ✅ required
- `npm test` (frontend) where applicable
- `npm run codegen` (backend) after Convex schema/functions changes ✅ required
- `npm run typecheck` (backend) ✅ required
- `npm test` (backend) add logic tests for overlap matching ✅ recommended

## Edge Cases to Cover

- user leaves queue while being highlighted
- user closes tab during press
- duplicate presses / spam tapping
- stale queue entries
- network lag causing delayed press events
- both users matched simultaneously with a third user candidate
- no available online users
- user has no username yet (signin path to `/welcome`)

## Senior Agent Workstreams (Spawn These)

### Agent A - Senior Realtime Backend Engineer

Owns:

- Convex schema/tables for soul game
- presence heartbeat
- press interval recording
- match overlap logic
- 2-minute session lifecycle
- backend tests for match fairness

### Agent B - Senior Frontend Realtime UX Engineer

Owns:

- `/soul_game` page UI
- button press interactions + animation states
- queue/match state subscriptions/hooks
- success animation overlay
- dual-theme polish + reduced motion support

### Agent C - Senior Game Interaction / Motion UX

Owns:

- timing feedback UX
- pulse/wave success animation
- candidate rotation transitions
- microinteraction consistency
- touch ergonomics (mobile-first)

### Agent D - Senior Design Systems / Asset Engineer

Owns:

- 10 soul game avatars (reusable SVG components)
- 20 onboarding placeholder avatars
- centralized `app/components/icons/` organization
- `data/avatars.ts` metadata structure

### Agent E - Senior Onboarding / Identity Flow Engineer

Owns:

- onboarding step 4 avatar selector
- random default avatar assignment
- username + avatar finalize step integration
- safe routing after signup/signin

### Agent F - Senior QA / Test Engineer

Owns:

- 2-browser test checklist
- edge-case scripts
- build/typecheck/test gates
- bug reproduction docs for timing mismatch scenarios

## Implementation Phases (Execution Order)

### Phase 0 - Design Contract + Data Contracts

- finalize `data/soul-game.ts` and `data/avatars.ts`
- define match timing constants
- finalize event/state shapes (frontend-backend contract)
- finalize `/soul_game` route UI states (idle/queueing/pressing/matched/session)

### Phase 1 - Backend Realtime Match Core

- Convex schema updates
- queue presence + heartbeat
- press events + overlap logic
- match session record creation
- backend tests

### Phase 2 - Frontend Soul Game MVP

- `/welcome` card click routing to `/soul_game`
- `/soul_game` UI shell and state machine
- large press button interactions
- realtime sync with backend
- success animation + 2-minute session intro

### Phase 3 - Avatar Assets + Candidate Rotation

- 10 soul avatars
- 5s rotation logic
- candidate rendering
- fallback states if no users online

### Phase 4 - Onboarding Avatar Step (Step 4)

- 20 placeholder avatars in `data/avatars.ts`
- modern avatar selector UI
- random preselection for new signup
- save selected avatar to local state + backend/placeholder persistence

### Phase 5 - QA + Stabilization

- 2-browser manual runs
- build/typecheck/tests
- latency edge cases
- retry and cleanup states

## Handoff Prompt for Next AI (Execution Intro Prompt)

Use this prompt to continue implementation:

```text
You are continuing the EYYMI TanStack + Convex app implementation.

Read first:
1. d:\eyymi_tanstack\docs\soul-game-realtime-implementation-plan.md
2. d:\eyymi_tanstack\app\routes\welcome.tsx
3. d:\eyymi_tanstack\app\routes\index.tsx
4. d:\eyymi_tanstack\data\index.ts
5. d:\eyymi_tanstack\app\components\icons\index.ts
6. d:\eyymi_backend_convex\convex\schema.ts

Task objective:
- Implement Phase 0 + Phase 1 + Phase 2 MVP of the Soul Game realtime feature.
- Add /soul_game route and wire the Soul game card from /welcome.
- Use server-side matching logic (Convex) based on press interval overlap.
- Keep dark/light mode compatible with existing EYYMI design tokens.
- Use DRY reusable icons/components and put static data in data/* with data/index.ts.

Rules:
- Do not expose raw backend/Convex errors to app users.
- Use user-friendly inline status messages.
- Keep mobile-first touch targets and reduced-motion support.
- Add QA notes and run build/typecheck before finishing.

Spawn senior agents/workstreams:
- Realtime Backend
- Frontend Realtime UX
- Motion UX
- Design System / Avatar Assets
- Onboarding Flow
- QA

Start by producing a file-level implementation checklist and then execute Phase 0.
```

