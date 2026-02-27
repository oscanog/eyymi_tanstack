export const COPY_CAROUSEL_ROTATE_MS = 2000;
export const COPY_CAROUSEL_TRANSITION_MS = 650;
export const COPY_MATCH_HOLD_MS = 2000;

export type CopyCarouselVisualState = {
  x: number;
  scale: number;
  opacity: number;
  blur: number;
  saturation: number;
  zIndex: number;
  isCenter: boolean;
  isVisible: boolean;
};

export function getWrappedIndex(currentIndex: number, step: number, total: number): number {
  if (total <= 0) return 0;
  const next = (currentIndex + step) % total;
  return next < 0 ? next + total : next;
}

export function getSignedCircularDistance(
  index: number,
  centerIndex: number,
  total: number,
): number {
  if (total <= 0) return 0;

  const direct = index - centerIndex;
  const forwardWrap = direct - total;
  const backwardWrap = direct + total;

  let best = direct;
  if (Math.abs(forwardWrap) < Math.abs(best)) best = forwardWrap;
  if (Math.abs(backwardWrap) < Math.abs(best)) best = backwardWrap;
  return best;
}

export function getCopyCarouselVisualState(
  index: number,
  centerIndex: number,
  total: number,
): CopyCarouselVisualState {
  const distance = getSignedCircularDistance(index, centerIndex, total);
  const abs = Math.abs(distance);
  const direction = distance === 0 ? 0 : distance > 0 ? 1 : -1;

  if (abs === 0) {
    return {
      x: 0,
      scale: 1.5,
      opacity: 1,
      blur: 0,
      saturation: 1,
      zIndex: 4,
      isCenter: true,
      isVisible: true,
    };
  }

  if (abs === 1) {
    return {
      x: direction * 96,
      scale: 1,
      opacity: 0.62,
      blur: 2,
      saturation: 0.7,
      zIndex: 3,
      isCenter: false,
      isVisible: true,
    };
  }

  if (abs === 2) {
    return {
      x: direction * 176,
      scale: 0.8,
      opacity: 0.26,
      blur: 8,
      saturation: 0.5,
      zIndex: 2,
      isCenter: false,
      isVisible: true,
    };
  }

  return {
    x: direction * 240,
    scale: 0.72,
    opacity: 0,
    blur: 10,
    saturation: 0.45,
    zIndex: 1,
    isCenter: false,
    isVisible: false,
  };
}

export function getHoldProgress(nowMs: number, holdStartMs: number, holdDurationMs: number): number {
  if (holdDurationMs <= 0) return 1;
  const elapsed = nowMs - holdStartMs;
  if (elapsed <= 0) return 0;
  if (elapsed >= holdDurationMs) return 1;
  return elapsed / holdDurationMs;
}
