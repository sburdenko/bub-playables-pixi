import { describe, expect, it } from 'vitest';
import { RoundTimer } from '../../../src/game/flow/RoundTimer';
import type { ITimerView } from '../../../src/game/ports/ITimerView';

class FakeTimerView implements ITimerView {
  fractions: number[] = [];

  setFractionLeft(fraction: number): void {
    this.fractions.push(fraction);
  }
}

describe('RoundTimer', () => {
  it('showsAFullBarFromTheStart', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(30, view);

    expect(view.fractions).toEqual([1]);
    expect(timer.isExpired).toBe(false);
  });

  it('drainsTheBarAsTimePasses', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(10, view);

    timer.update(2.5);

    expect(view.fractions.at(-1)).toBeCloseTo(0.75);
  });

  it('expiresAfterTheDurationAndKeepsTheBarEmpty', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(1, view);

    timer.update(0.6);
    expect(timer.isExpired).toBe(false);
    timer.update(0.6);
    timer.update(0.6);

    expect(timer.isExpired).toBe(true);
    expect(view.fractions.at(-1)).toBe(0);
  });
});
