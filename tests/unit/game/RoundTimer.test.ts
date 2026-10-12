import { describe, expect, it } from 'vitest';
import { RoundTimer } from '../../../src/game/flow/RoundTimer';
import { TIMER_GREEN, TIMER_RED } from '../../../src/domain/time/TimerTint';
import type { ITimerView, TimerLook } from '../../../src/game/ports/ITimerView';

class FakeTimerView implements ITimerView {
  looks: TimerLook[] = [];

  show(look: TimerLook): void {
    this.looks.push(look);
  }
}

describe('RoundTimer', () => {
  it('showsAFullBarFromTheStart', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(30, view);

    expect(view.looks).toEqual([{ fractionLeft: 1, tint: TIMER_GREEN }]);
    expect(timer.isExpired).toBe(false);
  });

  it('drainsTheBarAsTimePasses', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(10, view);

    timer.update(2.5);

    expect(view.looks.at(-1)?.fractionLeft).toBeCloseTo(0.75);
  });

  it('expiresAfterTheDurationAndKeepsTheBarEmpty', () => {
    const view = new FakeTimerView();
    const timer = new RoundTimer(1, view);

    timer.update(0.6);
    expect(timer.isExpired).toBe(false);
    timer.update(0.6);
    timer.update(0.6);

    expect(timer.isExpired).toBe(true);
    expect(view.looks.at(-1)).toEqual({ fractionLeft: 0, tint: TIMER_RED });
  });
});
