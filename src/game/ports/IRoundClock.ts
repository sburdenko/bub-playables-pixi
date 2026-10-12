/** Tells the turn whether the round's time is up. The turn never ends mid-move: it finishes the shot or attack first. */
export interface IRoundClock {
  readonly isExpired: boolean;
}
