/** What the timer bar shows. */
export type TimerLook = {
  /** 1 = the whole round is left, 0 = the time is up. */
  readonly fractionLeft: number;
  /** Colour of the fill, 0xRRGGBB. */
  readonly tint: number;
};

/** Shows how much of the round is left. */
export interface ITimerView {
  show(look: TimerLook): void;
}
