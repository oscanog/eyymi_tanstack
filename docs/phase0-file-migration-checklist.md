# Phase 0 File-by-File Migration Checklist

Status: Generated on 2026-02-24 (live target existence check)
Purpose: Track source -> target file migration from the working reference app into `eyymi_tanstack` and `eyymi_backend_convex`.

Legend: `TODO` = not copied yet, `COPIED` = copied/adapted, `DEFERRED` = intentionally postponed.

## Frontend (`d:\eyymi_tanstack`)

| Status | Source | Target | Notes |
|---|---|---|---|
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\.cta.json` | `d:\eyymi_tanstack\.cta.json` | Root scaffold file |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\package.json` | `d:\eyymi_tanstack\package.json` | Root scaffold file |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\bun.lock` | `d:\eyymi_tanstack\bun.lock` | Root scaffold file |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\README.md` | `d:\eyymi_tanstack\README.md` | Root scaffold file |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\tsconfig.json` | `d:\eyymi_tanstack\tsconfig.json` | Root scaffold file |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\vite.config.ts` | `d:\eyymi_tanstack\vite.config.ts` | Root scaffold file |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\client.tsx` | `d:\eyymi_tanstack\app\client.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\Header.tsx` | `d:\eyymi_tanstack\app\components\Header.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\Map.tsx` | `d:\eyymi_tanstack\app\components\Map.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\map\MapSwitcher.tsx` | `d:\eyymi_tanstack\app\components\map\MapSwitcher.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\map\providers\GoogleMap.tsx` | `d:\eyymi_tanstack\app\components\map\providers\GoogleMap.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\map\providers\LeafletMap.tsx` | `d:\eyymi_tanstack\app\components\map\providers\LeafletMap.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\map\types.ts` | `d:\eyymi_tanstack\app\components\map\types.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\modals\IdentityRecoveryDialog.tsx` | `d:\eyymi_tanstack\app\components\modals\IdentityRecoveryDialog.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\modals\MeetingPlaceDialogs.tsx` | `d:\eyymi_tanstack\app\components\modals\MeetingPlaceDialogs.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\modals\SessionInviteDialogs.tsx` | `d:\eyymi_tanstack\app\components\modals\SessionInviteDialogs.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\PWAMeta.tsx` | `d:\eyymi_tanstack\app\components\PWAMeta.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\session\SessionDetailsBottomSheet.tsx` | `d:\eyymi_tanstack\app\components\session\SessionDetailsBottomSheet.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\sidebar\OnlineUsersDrawer.tsx` | `d:\eyymi_tanstack\app\components\sidebar\OnlineUsersDrawer.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\ui\Button.tsx` | `d:\eyymi_tanstack\app\components\ui\Button.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\ui\Input.tsx` | `d:\eyymi_tanstack\app\components\ui\Input.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\components\ui\Skeleton.tsx` | `d:\eyymi_tanstack\app\components\ui\Skeleton.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\env.d.ts` | `d:\eyymi_tanstack\app\env.d.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\index.ts` | `d:\eyymi_tanstack\app\hooks\index.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useBottomSheetDrag.ts` | `d:\eyymi_tanstack\app\hooks\useBottomSheetDrag.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useConvexQuery.ts` | `d:\eyymi_tanstack\app\hooks\useConvexQuery.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useLiveRoute.ts` | `d:\eyymi_tanstack\app\hooks\useLiveRoute.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useLocation.ts` | `d:\eyymi_tanstack\app\hooks\useLocation.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMapCameraPreference.test.ts` | `d:\eyymi_tanstack\app\hooks\useMapCameraPreference.test.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMapCameraPreference.ts` | `d:\eyymi_tanstack\app\hooks\useMapCameraPreference.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMapModePreference.ts` | `d:\eyymi_tanstack\app\hooks\useMapModePreference.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMeetingPlace.ts` | `d:\eyymi_tanstack\app\hooks\useMeetingPlace.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMeetingPlaceSearch.test.ts` | `d:\eyymi_tanstack\app\hooks\useMeetingPlaceSearch.test.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMeetingPlaceSearch.ts` | `d:\eyymi_tanstack\app\hooks\useMeetingPlaceSearch.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMeetingRoutes.test.ts` | `d:\eyymi_tanstack\app\hooks\useMeetingRoutes.test.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useMeetingRoutes.ts` | `d:\eyymi_tanstack\app\hooks\useMeetingRoutes.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useOnlineUsers.ts` | `d:\eyymi_tanstack\app\hooks\useOnlineUsers.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\usePresenceHeartbeat.ts` | `d:\eyymi_tanstack\app\hooks\usePresenceHeartbeat.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useServiceWorker.ts` | `d:\eyymi_tanstack\app\hooks\useServiceWorker.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useSession.ts` | `d:\eyymi_tanstack\app\hooks\useSession.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useSessionInvites.ts` | `d:\eyymi_tanstack\app\hooks\useSessionInvites.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\hooks\useUser.ts` | `d:\eyymi_tanstack\app\hooks\useUser.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\api.ts` | `d:\eyymi_tanstack\app\lib\api.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\convex.test.ts` | `d:\eyymi_tanstack\app\lib\convex.test.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\convex.ts` | `d:\eyymi_tanstack\app\lib\convex.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\convexAPI.ts` | `d:\eyymi_tanstack\app\lib\convexAPI.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\googleMapsLoader.ts` | `d:\eyymi_tanstack\app\lib\googleMapsLoader.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\joinHandoff.ts` | `d:\eyymi_tanstack\app\lib\joinHandoff.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\storage.ts` | `d:\eyymi_tanstack\app\lib\storage.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\username.ts` | `d:\eyymi_tanstack\app\lib\username.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\lib\utils.ts` | `d:\eyymi_tanstack\app\lib\utils.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\router.tsx` | `d:\eyymi_tanstack\app\router.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\__root.tsx` | `d:\eyymi_tanstack\app\routes\__root.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\index.tsx` | `d:\eyymi_tanstack\app\routes\index.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\map.$sessionId.tsx` | `d:\eyymi_tanstack\app\routes\map.$sessionId.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\session.tsx` | `d:\eyymi_tanstack\app\routes\session.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\session\create.tsx` | `d:\eyymi_tanstack\app\routes\session\create.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\session\index.tsx` | `d:\eyymi_tanstack\app\routes\session\index.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\session\join.tsx` | `d:\eyymi_tanstack\app\routes\session\join.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routes\session\list.tsx` | `d:\eyymi_tanstack\app\routes\session\list.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\routeTree.gen.ts` | `d:\eyymi_tanstack\app\routeTree.gen.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\ssr.tsx` | `d:\eyymi_tanstack\app\ssr.tsx` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\store\userStore.ts` | `d:\eyymi_tanstack\app\store\userStore.ts` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\app\styles\styles.css` | `d:\eyymi_tanstack\app\styles\styles.css` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\favicon.ico` | `d:\eyymi_tanstack\public\favicon.ico` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\logo192.png` | `d:\eyymi_tanstack\public\logo192.png` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\logo512.png` | `d:\eyymi_tanstack\public\logo512.png` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\manifest.json` | `d:\eyymi_tanstack\public\manifest.json` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\robots.txt` | `d:\eyymi_tanstack\public\robots.txt` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\sw.js` | `d:\eyymi_tanstack\public\sw.js` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\tanstack-circle-logo.png` | `d:\eyymi_tanstack\public\tanstack-circle-logo.png` | Frontend app/public port |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\public\tanstack-word-logo-white.svg` | `d:\eyymi_tanstack\public\tanstack-word-logo-white.svg` | Frontend app/public port |

## Backend (`d:\eyymi_backend_convex`)

| Status | Source | Target | Notes |
|---|---|---|---|
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\package.json` | `d:\eyymi_backend_convex\package.json` | Backend config/docs wiring |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\vitest.config.ts` | `d:\eyymi_backend_convex\vitest.config.ts` | Backend config/docs wiring |
| COPIED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\README.md` | `d:\eyymi_backend_convex\README.md` | Backend config/docs wiring |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\__tests__\e2e.test.ts` | `d:\eyymi_backend_convex\convex\__tests__\e2e.test.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\__tests__\meetingPlaces.logic.test.ts` | `d:\eyymi_backend_convex\convex\__tests__\meetingPlaces.logic.test.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\__tests__\routes.logic.test.ts` | `d:\eyymi_backend_convex\convex\__tests__\routes.logic.test.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\__tests__\schema.test.ts` | `d:\eyymi_backend_convex\convex\__tests__\schema.test.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\_generated\api.d.ts` | `d:\eyymi_backend_convex\convex\_generated\api.d.ts` | Generated Convex file (copy now, regenerate later) |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\_generated\api.js` | `d:\eyymi_backend_convex\convex\_generated\api.js` | Generated Convex file (copy now, regenerate later) |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\_generated\dataModel.d.ts` | `d:\eyymi_backend_convex\convex\_generated\dataModel.d.ts` | Generated Convex file (copy now, regenerate later) |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\_generated\server.d.ts` | `d:\eyymi_backend_convex\convex\_generated\server.d.ts` | Generated Convex file (copy now, regenerate later) |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\_generated\server.js` | `d:\eyymi_backend_convex\convex\_generated\server.js` | Generated Convex file (copy now, regenerate later) |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\crons.ts` | `d:\eyymi_backend_convex\convex\crons.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\health.ts` | `d:\eyymi_backend_convex\convex\health.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\invites.ts` | `d:\eyymi_backend_convex\convex\invites.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\locations.ts` | `d:\eyymi_backend_convex\convex\locations.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\locationSessions.ts` | `d:\eyymi_backend_convex\convex\locationSessions.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\meetingPlaces.ts` | `d:\eyymi_backend_convex\convex\meetingPlaces.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\README.md` | `d:\eyymi_backend_convex\convex\README.md` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\routes.ts` | `d:\eyymi_backend_convex\convex\routes.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\schema.ts` | `d:\eyymi_backend_convex\convex\schema.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\sessions.ts` | `d:\eyymi_backend_convex\convex\sessions.ts` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\tsconfig.json` | `d:\eyymi_backend_convex\convex\tsconfig.json` | Backend Convex module/test |
| COPIED | `D:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\backend\convex\users.ts` | `d:\eyymi_backend_convex\convex\users.ts` | Backend Convex module/test |

## Deferred / Not In Scope for Initial Port

| Status | Source | Reason |
|---|---|---|
| DEFERRED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\\backend\\docs\\*` | Optional backend docs; port after code parity |
| DEFERRED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\\docs\\FLUTTER_*` | Flutter conversion docs not needed for TanStack+Convex migration |
| DEFERRED | `d:\eyymi_backend_convex\reference_map_complete_tanstack_mobile_first\\backend` | Split-repo architecture; backend goes to `d:\eyymi_backend_convex` |
