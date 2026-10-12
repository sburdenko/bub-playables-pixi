/** Time left out of a fixed duration. Immutable: advancing returns a new value. */
export type Countdown = { readonly duration: number; readonly remaining: number };

export function createCountdown(durationSeconds: number): Countdown {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError(`A countdown needs a positive duration, got ${durationSeconds}.`);
  }

  return { duration: durationSeconds, remaining: durationSeconds };
}

export function advanceCountdown(countdown: Countdown, deltaSeconds: number): Countdown {
  return { duration: countdown.duration, remaining: Math.max(0, countdown.remaining - deltaSeconds) };
}

/** 1 at the start, 0 when the time is up. */
export function fractionLeft(countdown: Countdown): number {
  return countdown.remaining / countdown.duration;
}

export function isExpired(countdown: Countdown): boolean {
  return countdown.remaining <= 0;
}
