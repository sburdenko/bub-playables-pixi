import { ObjectPool } from './ObjectPool';

/** One pool per key, for objects that are only interchangeable with others of the same kind. */
export class KeyedPool<K, T> {
  private readonly _create: (key: K) => T;
  private readonly _reset: (item: T) => void;
  private readonly _pools = new Map<K, ObjectPool<T>>();

  constructor(create: (key: K) => T, reset: (item: T) => void) {
    this._create = create;
    this._reset = reset;
  }

  acquire(key: K): T {
    return this.poolOf(key).acquire();
  }

  release(key: K, item: T): void {
    this.poolOf(key).release(item);
  }

  private poolOf(key: K): ObjectPool<T> {
    const existing = this._pools.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const created = new ObjectPool<T>(() => this._create(key), this._reset);
    this._pools.set(key, created);

    return created;
  }
}
