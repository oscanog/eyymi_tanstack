export type RingDirection = "clockwise" | "counter_clockwise";

export function getProgressRatio(nowMs: number, startAt: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  const elapsed = nowMs - startAt;
  if (elapsed <= 0) return 0;
  if (elapsed >= durationMs) return 1;
  return elapsed / durationMs;
}

export function shouldShowNoCandidatesDecision(params: {
  hasPreferredGender: boolean;
  hasCandidatesForPreferred: boolean;
  filterMode: "preferred_only" | "all_genders";
}): boolean {
  return (
    params.filterMode === "preferred_only" &&
    params.hasPreferredGender &&
    !params.hasCandidatesForPreferred
  );
}

