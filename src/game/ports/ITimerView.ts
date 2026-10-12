/** Shows how much of the round is left. */
export interface ITimerView {
  /** 1 = the whole round is left, 0 = the time is up. */
  setFractionLeft(fraction: number): void;
}
