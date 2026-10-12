import { mixColor } from '../../core/math/Color';
import { clamp01 } from '../../core/math/Scalar';
import type { Countdown } from './Countdown';

export const TIMER_GREEN = 0x45e04a;
export const TIMER_ORANGE = 0xffa31a;
export const TIMER_RED = 0xff3030;

/** Share of the round that has passed when the bar starts turning orange and, later, red. */
const ORANGE_FROM_SHARE = 0.5;
const RED_FROM_SHARE = 0.8;
const FADE_SECONDS = 2;

/**
 * Green, then smoothly orange from the middle of the round, then smoothly red; each fade takes two seconds, or the time
 * left before the next stage in a short round, so the bar is always red at the end.
 */
export function timerTint(countdown: Countdown): number {
  const elapsed = countdown.duration - countdown.remaining;
  const orangeStart = countdown.duration * ORANGE_FROM_SHARE;
  const redStart = countdown.duration * RED_FROM_SHARE;
  const toOrange = fadeProgress(elapsed, orangeStart, Math.min(FADE_SECONDS, redStart - orangeStart));
  const toRed = fadeProgress(elapsed, redStart, Math.min(FADE_SECONDS, countdown.duration - redStart));

  return mixColor(mixColor(TIMER_GREEN, TIMER_ORANGE, toOrange), TIMER_RED, toRed);
}

function fadeProgress(elapsed: number, start: number, seconds: number): number {
  return clamp01((elapsed - start) / seconds);
}
