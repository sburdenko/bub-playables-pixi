import { advanceCountdown, createCountdown, fractionLeft, isExpired, type Countdown } from '../../domain/time/Countdown';
import type { TimerTintSchedule } from '../../domain/config/GameConfig';
import { timerTint } from '../../domain/time/TimerTint';
import type { IRoundClock } from '../ports/IRoundClock';
import type { ITimerView } from '../ports/ITimerView';

/** The round's clock: counts the time down and keeps the timer bar in step with it. */
export class RoundTimer implements IRoundClock {
  private _countdown: Countdown;
  private readonly _view: ITimerView;
  private readonly _tintSchedule: TimerTintSchedule;

  constructor(durationSeconds: number, view: ITimerView, tintSchedule: TimerTintSchedule) {
    this._countdown = createCountdown(durationSeconds);
    this._view = view;
    this._tintSchedule = tintSchedule;
    this.showCountdown();
  }

  get isExpired(): boolean {
    return isExpired(this._countdown);
  }

  update(deltaSeconds: number): void {
    this._countdown = advanceCountdown(this._countdown, deltaSeconds);
    this.showCountdown();
  }

  private showCountdown(): void {
    this._view.show({ fractionLeft: fractionLeft(this._countdown), tint: timerTint(this._countdown, this._tintSchedule) });
  }
}
