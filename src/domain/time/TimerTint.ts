import { mixColor } from '../../core/math/Color';
import { clamp01 } from '../../core/math/Scalar';
import type { TimerTintSchedule } from '../config/GameConfig';
import type { Countdown } from './Countdown';

export const TIMER_GREEN = 0x45e04a;
export const TIMER_ORANGE = 0xffa31a;
export const TIMER_RED = 0xff3030;

/**
 * Green, then smoothly orange from the middle of the round, then smoothly red; each fade takes two seconds, or the time
 * left before the next stage in a short round, so the bar is always red at the end.
 */
export function timerTint(countdown: Countdown, schedule: TimerTintSchedule): number {
  const elapsed = countdown.duration - countdown.remaining;
  const orangeStart = countdown.duration * schedule.orangeFromShare;
  const redStart = countdown.duration * schedule.redFromShare;
  const toOrange = fadeProgress(elapsed, orangeStart, Math.min(schedule.fadeSeconds, redStart - orangeStart));
  const toRed = fadeProgress(elapsed, redStart, Math.min(schedule.fadeSeconds, countdown.duration - redStart));

  return mixColor(mixColor(TIMER_GREEN, TIMER_ORANGE, toOrange), TIMER_RED, toRed);
}

function fadeProgress(elapsed: number, start: number, seconds: number): number {
  return clamp01((elapsed - start) / seconds);
}
