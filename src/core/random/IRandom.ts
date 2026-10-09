/** Source of uniformly distributed numbers in [0, 1); injectable so gameplay can be replayed with a seed. */
export interface IRandom {
  next(): number;
}

export function randomRange(random: IRandom, min: number, max: number): number {
  return min + (max - min) * random.next();
}

export function randomPick<T>(random: IRandom, items: readonly T[]): T | undefined {
  return items[Math.floor(random.next() * items.length)];
}
