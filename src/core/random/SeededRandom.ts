import type { IRandom } from './IRandom';

/** Deterministic generator (mulberry32) for tests and `?seed=` replays. */
export class SeededRandom implements IRandom {
  private _state: number;

  constructor(seed: number) {
    this._state = seed >>> 0;
  }

  next(): number {
    this._state = (this._state + 0x6d2b79f5) >>> 0;
    let mixed = this._state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }
}
