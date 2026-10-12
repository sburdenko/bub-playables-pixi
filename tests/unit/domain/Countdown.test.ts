import { describe, expect, it } from 'vitest';
import { advanceCountdown, createCountdown, fractionLeft, isExpired } from '../../../src/domain/time/Countdown';

describe('Countdown', () => {
  it('startsFullAndNotExpired', () => {
    const countdown = createCountdown(30);

    expect(fractionLeft(countdown)).toBe(1);
    expect(isExpired(countdown)).toBe(false);
  });

  it('advancingReturnsANewCountdownAndKeepsTheOriginal', () => {
    const start = createCountdown(30);
    const later = advanceCountdown(start, 7.5);

    expect(fractionLeft(later)).toBeCloseTo(0.75);
    expect(fractionLeft(start)).toBe(1);
  });

  it('expiresExactlyWhenTheDurationHasPassedAndNeverGoesNegative', () => {
    const almost = advanceCountdown(createCountdown(2), 1.99);
    const done = advanceCountdown(almost, 5);

    expect(isExpired(almost)).toBe(false);
    expect(isExpired(done)).toBe(true);
    expect(fractionLeft(done)).toBe(0);
  });

  it('rejectsADurationThatIsNotAPositiveNumber', () => {
    for (const duration of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createCountdown(duration)).toThrow(RangeError);
    }
  });
});
