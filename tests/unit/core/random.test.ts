import { describe, expect, it } from 'vitest';
import { randomPick, randomRange, type IRandom } from '../../../src/core/random/IRandom';
import { MathRandom } from '../../../src/core/random/MathRandom';
import { SeededRandom } from '../../../src/core/random/SeededRandom';

const fixed = (value: number): IRandom => ({ next: () => value });

describe('random', () => {
  it('seededRandom_isRepeatableAndInRange', () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    const values = Array.from({ length: 100 }, () => first.next());

    expect(values).toEqual(Array.from({ length: 100 }, () => second.next()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new SeededRandom(7).next()).not.toBe(new SeededRandom(8).next());
  });

  it('mathRandom_isInRange', () => {
    const value = new MathRandom().next();

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it('rangeAndPick', () => {
    expect(randomRange(fixed(0.5), 3, 5)).toBe(4);
    expect(randomPick(fixed(0.99), ['a', 'b', 'c'])).toBe('c');
    expect(randomPick(fixed(0), [])).toBeUndefined();
  });
});
