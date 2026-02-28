# `/copy` Matching Guide

## What This Is

`/copy` is the realtime matching demo route for the carousel-based hold-to-match experience.

Use this document when you need to:

- understand how `/copy` decides who appears in the carousel
- manually test the match flow
- verify the 3-second matching window
- verify the clockwise and counter-clockwise ring behavior
- verify preference-based filtering such as male -> female

## Route To Test

Normal manual route:

- `/copy`

Deterministic local screenshot/debug route:

- `/copy?e2e=<runId>&debug=shots`

Examples:

- `/copy`
- `/copy?e2e=local-debug-001&debug=shots`

Use the debug route only for local diagnostics and Playwright runs. Normal product testing should use `/copy`.

## Core Rules

### 1. Matching Is Server-Authoritative

The server decides:

- which user is currently centered and matchable
- which 3-second window is active
- whether reciprocal targeting is valid
- whether a match is successful

The client must not invent its own centered target.

### 2. Only The Center Avatar Is Matchable

At any given moment, only the centered avatar can be matched.

Side avatars are visual only. Pressing while a user is not the current centered target must not produce a valid match.

### 3. Match Windows Last 3 Seconds

Each focused center target is active for a 3-second window.

The centered countdown should visibly show:

- `3`
- `2`
- `1`

When the window resets, the center target may change and all in-window hold state resets.

### 4. 100% Requires 1.5 Seconds Of Hold

The hold ring fills from `0%` to `100%` over `1.5` seconds.

Reaching `100%` means that user is ready within the current 3-second window.

### 5. Both Users Must Be Ready In The Same 3-Second Window

A match only succeeds when:

- user A reaches `100%`
- user B reaches `100%`
- both happen inside the same active 3-second window

If one user becomes ready in window A and the other becomes ready in window B, there is no match.

### 6. One-Sided Hold Never Matches

If only one user presses and reaches `100%`, that alone must never create a match.

## Carousel Visibility Rules

## Preference Filter

Each user has a preferred match gender.

Default filter mode:

- `preferred_only`

Fallback filter mode:

- `all_genders`

### What This Means

If a male user has preference `female`, then in `preferred_only` mode:

- he should only see female candidates in the matching carousel
- male, gay, or lesbian candidates must not appear as matchable candidates for him in that mode

If a female user has preference `male`, then in `preferred_only` mode:

- she should only see male candidates in the matching carousel

If there are no preferred candidates online:

- the no-candidates modal should appear
- the user can continue with all genders
- or change preference

## Scenario Examples

### Scenario A: Male Wants Female

Setup:

- user 1 gender: `male`
- user 1 preference: `female`
- user 2 gender: `female`
- user 3 gender: `male`

Expected:

- user 1 can see user 2 in the carousel
- user 1 must not see user 3 as a valid preferred-only match candidate
- if user 2 is the center avatar, user 1 can attempt a match
- if only user 3 is online, user 1 should get the no-candidates state for preferred-only mode

### Scenario B: Female Wants Male

Setup:

- user 1 gender: `female`
- user 1 preference: `male`
- user 2 gender: `male`

Expected:

- user 1 sees user 2 in the carousel
- if user 2 is centered, user 1 can attempt the hold interaction

### Scenario C: No Preferred Candidates

Setup:

- user 1 gender: `male`
- user 1 preference: `female`
- only male candidates are online

Expected:

- preferred-only mode shows no valid candidates
- no-candidates modal appears
- user can switch to `all_genders`

### Scenario D: Reciprocal Same-Window Match

Setup:

- two compatible users
- both are online and visible to each other
- both press in the same active 3-second window

Expected:

- both users see their own ring while pressing
- each user sees the second ring only when the other user is pressing back
- both reach `100%` in the same window
- success modal opens for both

### Scenario E: One-Sided Hold

Setup:

- user 1 presses
- user 2 does not press back

Expected:

- user 1 sees only their own ring
- user 2 does not cause reciprocal ring confirmation for a match
- no success modal appears

## Ring Behavior

## Local User Ring

The local user ring is the outer ring.

Expected behavior:

- visible while the local user is pressing
- circles clockwise
- fills toward `100%`
- has a visible moving head/cap
- freezes as a full ring when ready

## Reciprocal Partner Ring

The reciprocal partner ring is the inner ring.

Expected behavior:

- only appears when the centered user is pressing back at the local user
- circles counter-clockwise
- has equal visual emphasis to the self ring
- uses a distinct color
- freezes as a full ring when that user is ready

## What Should Not Happen

- the partner ring must not appear before reciprocal press exists
- the ring must not look like a static wedge with no obvious motion
- the self ring must not rotate counter-clockwise
- the partner ring must not rotate clockwise

## Success Modal Rules

When a same-window match succeeds:

- success modal opens for both users
- modal stays open until one user closes it
- closing it closes the modal for both users
- the carousel resumes after close
- `/copy` does not auto-enter chat or session in this demo

## Manual Test Checklist

### Basic Route Check

- open `/copy`
- verify the page loads
- verify a center avatar is shown when candidates exist
- verify the countdown is visible above the center avatar

### Preference Check

- set user 1 to `male -> female`
- verify only female candidates are shown in preferred-only mode
- verify no-candidates modal appears when no female candidates are online

### Countdown Check

- watch the centered countdown
- verify it visibly changes from `3` to `2` to `1`
- verify the centered target changes only on the server window boundary

### One-Sided Hold Check

- user 1 presses and holds
- verify user 1 sees the clockwise outer ring
- verify user 1 does not see the inner reciprocal ring yet
- verify no match occurs if user 2 does nothing

### Reciprocal Hold Check

- user 1 starts pressing
- user 2 presses back in the same window
- verify user 1 sees the counter-clockwise inner ring
- verify user 2 sees the same reciprocal behavior from their own point of view

### Match Success Check

- start both holds early enough in the same 3-second window
- keep holding until both reach `100%`
- verify success modal opens on both clients

### Close Modal Check

- close the modal on one client
- verify it closes on both clients
- verify both remain on `/copy`

## Local Playwright Verification

Useful command:

```bash
npm run e2e:copy:shots
```

What it does:

- opens two users
- loads `/copy?e2e=<runId>&debug=shots`
- captures four screenshots
- verifies ring direction metadata and screenshot states

Primary screenshots:

- `user1-before.png`
- `user2-before.png`
- `user1-plus1s-both-pressing.png`
- `user2-plus1s-both-pressing.png`

## Reader-Friendly Summary

If you want the short version:

- test `/copy`
- only the centered avatar is matchable
- preferred-only mode filters candidates by preferred gender
- example: male wanting female should only see female candidates in that mode
- each chance window lasts 3 seconds
- 100% needs 1.5 seconds of hold
- self ring circles clockwise
- reciprocal ring appears only when the other user presses back and circles counter-clockwise
- both users must hit 100% in the same 3-second window to match
- success modal stays open until closed manually
