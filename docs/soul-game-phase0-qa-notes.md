# Soul Game Phase 0 QA Notes

## Scope Verified (Phase 0)

- Added Soul Game static data contracts in `data/soul-game.ts`
- Added avatar metadata contracts in `data/avatars.ts`
- Exported new data modules from `data/index.ts`
- Added frontend contract types in `app/features/soul-game/contracts.ts`
- Added `/soul_game` Phase 0 route shell in `app/routes/soul_game.tsx`
- Route registration confirmed via generated `app/routeTree.gen.ts`

## Validation Run (2026-02-25)

- `npm run typecheck` ✅
- `npm run build` ✅

## Manual QA Notes (Phase 0 UI Shell)

- Verify `/soul_game` loads for authenticated users and redirects unauthenticated users to `/signin`
- Verify state preview buttons switch between all route UI states (`idle`, `queueing`, `pressing`, `matched`, `session`, `error`)
- Verify inline status copy updates per state and error state uses user-friendly text only
- Verify large press button remains touch-friendly on mobile width (44px+ controls, large circular CTA)
- Verify animations respect reduced motion classes (`motion-reduce:*`) and UI remains usable
- Verify dark/light token compatibility visually (uses existing `var(--color-*)` design tokens)

## Known Gaps (Expected Until Phase 1/2)

- No Convex realtime presence/matching logic yet
- `/welcome` Soul Game card is not wired yet
- No candidate rotation from live queue yet (static contract preview only)
- No 2-minute session lifecycle or countdown yet
- No backend schema/functions for Soul Game yet
