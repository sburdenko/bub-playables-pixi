import type { IRandom } from './IRandom';

export class MathRandom implements IRandom {
  next(): number {
    return Math.random();
  }
}
