export type RingDirection = "clockwise" | "counter-clockwise";

export type RingPoint = {
  x: number;
  y: number;
};

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

export function clampProgressRatio(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  return progress;
}

export function getRingHeadAngle(
  progress: number,
  direction: RingDirection,
  startAngle = -90
): number {
  const clamped = clampProgressRatio(progress);
  const sweep = clamped * 360;
  return direction === "clockwise" ? startAngle + sweep : startAngle - sweep;
}

export function getRingPoint(
  radius: number,
  angleDeg: number,
  center = 120
): RingPoint {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angleRad),
    y: center + radius * Math.sin(angleRad),
  };
}

export function describeRingArc(params: {
  radius: number;
  progress: number;
  direction: RingDirection;
  center?: number;
  startAngle?: number;
}): string | null {
  const center = params.center ?? 120;
  const startAngle = params.startAngle ?? -90;
  const clamped = clampProgressRatio(params.progress);

  if (clamped <= 0 || clamped >= 1) {
    return null;
  }

  const endAngle = getRingHeadAngle(clamped, params.direction, startAngle);
  const start = getRingPoint(params.radius, startAngle, center);
  const end = getRingPoint(params.radius, endAngle, center);
  const largeArcFlag = clamped > 0.5 ? 1 : 0;
  const sweepFlag = params.direction === "clockwise" ? 1 : 0;

  return `M ${start.x} ${start.y} A ${params.radius} ${params.radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

