import { advanceCountdown, createCountdown, fractionLeft, isExpired, type Countdown } from '../../domain/time/Countdown';
import type { ITimerView } from '../ports/ITimerView';
import type { IRoundClock } from './TurnFlow';

/** The round's clock: counts the time down and keeps the timer bar in step with it. */
export class RoundTimer implements IRoundClock {
  private _countdown: Countdown;
  private readonly _view: ITimerView;

  constructor(durationSeconds: number, view: ITimerView) {
    this._countdown = createCountdown(durationSeconds);
    this._view = view;
    this._view.setFractionLeft(fractionLeft(this._countdown));
  }

  get isExpired(): boolean {
    return isExpired(this._countdown);
  }

  update(deltaSeconds: number): void {
    this._countdown = advanceCountdown(this._countdown, deltaSeconds);
    this._view.setFractionLeft(fractionLeft(this._countdown));
  }
}
