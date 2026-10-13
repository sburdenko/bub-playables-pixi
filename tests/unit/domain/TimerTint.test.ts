import { describe, expect, it } from 'vitest';
import { mixColor } from '../../../src/core/math/Color';
import { advanceCountdown, createCountdown } from '../../../src/domain/time/Countdown';
import { TIMER_GREEN, TIMER_ORANGE, TIMER_RED, timerTint } from '../../../src/domain/time/TimerTint';
import { DEFAULT_GAME_CONFIG } from '../../../src/domain/config/GameConfig';

const ROUND_SECONDS = 30;

function tintAt(elapsedSeconds: number, duration = ROUND_SECONDS): number {
  return timerTint(advanceCountdown(createCountdown(duration), elapsedSeconds), DEFAULT_GAME_CONFIG.timerTint);
}

describe('timerTint', () => {
  it('isGreenUntilTheMiddleOfTheRound', () => {
    expect(tintAt(0)).toBe(TIMER_GREEN);
    expect(tintAt(14.9)).toBe(TIMER_GREEN);
  });

  it('fadesToOrangeOverTwoSecondsFromTheMiddle', () => {
    expect(tintAt(15)).toBe(TIMER_GREEN);
    expect(tintAt(16)).toBe(mixColor(TIMER_GREEN, TIMER_ORANGE, 0.5));
    expect(tintAt(17)).toBe(TIMER_ORANGE);
    expect(tintAt(20)).toBe(TIMER_ORANGE);
  });

  it('fadesToRedOverTwoSecondsNearTheEnd', () => {
    expect(tintAt(24)).toBe(TIMER_ORANGE);
    expect(tintAt(25)).toBe(mixColor(TIMER_ORANGE, TIMER_RED, 0.5));
    expect(tintAt(26)).toBe(TIMER_RED);
    expect(tintAt(30)).toBe(TIMER_RED);
  });

  it('stillRunsFromGreenToRedInAShortRound', () => {
    const start = tintAt(0, 5);
    const end = tintAt(5, 5);

    expect(start).toBe(TIMER_GREEN);
    expect(end).toBe(TIMER_RED);
  });
});
