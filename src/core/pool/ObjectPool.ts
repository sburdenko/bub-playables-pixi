/**
 * Reuses objects that would otherwise be created and thrown away over and over. `reset` puts a released object back
 * in a clean state, so `acquire` can hand it out as if it were new.
 */
export class ObjectPool<T> {
  private readonly _create: () => T;
  private readonly _reset: (item: T) => void;
  private readonly _idle = new Set<T>();

  constructor(create: () => T, reset: (item: T) => void) {
    this._create = create;
    this._reset = reset;
  }

  get idleCount(): number {
    return this._idle.size;
  }

  acquire(): T {
    for (const item of this._idle) {
      this._idle.delete(item);

      return item;
    }

    return this._create();
  }

  /** Gives an object back. Releasing one that is already idle changes nothing. */
  release(item: T): void {
    if (this._idle.has(item)) {
      return;
    }

    this._reset(item);
    this._idle.add(item);
  }
}
