/** Steps in one forth-and-back pass over `frameCount` frames: 0 → last → 1. */
export function pingPongStepCount(frameCount: number): number {
  return frameCount > 1 ? frameCount * 2 - 2 : 1;
}

/** Frame shown at `step` of a forth-and-back pass. */
export function pingPongFrame(step: number, frameCount: number): number {
  const last = frameCount - 1;

  return step <= last ? step : last * 2 - step;
}
