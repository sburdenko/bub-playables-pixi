import { KeyedPool } from './KeyedPool';

/**
 * Hands out items and keeps the list of those in use. An item that marks itself destroyed is taken back by `sweep`,
 * reset, and handed out again for the same key, so nothing is created again while an idle one exists.
 */
export class RecyclingPool<K, T extends { readonly isDestroyed: boolean }> {
  private readonly _idle: KeyedPool<K, T>;
  private readonly _keyOf: (item: T) => K;
  private _active: readonly T[] = [];

  constructor(create: (key: K) => T, reset: (item: T) => void, keyOf: (item: T) => K) {
    this._idle = new KeyedPool<K, T>(create, reset);
    this._keyOf = keyOf;
  }

  get active(): readonly T[] {
    return this._active;
  }

  acquire(key: K): T {
    const item = this._idle.acquire(key);
    this._active = [...this._active, item];

    return item;
  }

  /** Takes back every active item that has been destroyed. */
  sweep(): void {
    const finished = this._active.filter((item) => item.isDestroyed);
    if (finished.length === 0) {
      return;
    }

    this._active = this._active.filter((item) => !item.isDestroyed);
    finished.forEach((item) => this._idle.release(this._keyOf(item), item));
  }
}
