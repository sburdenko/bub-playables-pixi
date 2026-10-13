import { describe, expect, it } from 'vitest';
import { KeyedPool } from '../../../src/core/pool/KeyedPool';
import { ObjectPool } from '../../../src/core/pool/ObjectPool';

type Thing = { id: number; used: boolean };

function thingPool(): { pool: ObjectPool<Thing>; created: () => number } {
  let count = 0;
  const pool = new ObjectPool<Thing>(
    () => ({ id: ++count, used: false }),
    (thing) => {
      thing.used = false;
    },
  );

  return { pool, created: () => count };
}

describe('ObjectPool', () => {
  it('createsAnObjectWhenNothingIsFree', () => {
    const { pool, created } = thingPool();

    expect(pool.acquire().id).toBe(1);
    expect(pool.acquire().id).toBe(2);
    expect(created()).toBe(2);
  });

  it('handsBackAReleasedObjectInsteadOfCreatingANewOne', () => {
    const { pool, created } = thingPool();
    const first = pool.acquire();

    pool.release(first);
    const again = pool.acquire();

    expect(again).toBe(first);
    expect(created()).toBe(1);
  });

  it('resetsAnObjectWhenItIsReleased', () => {
    const { pool } = thingPool();
    const thing = pool.acquire();
    thing.used = true;

    pool.release(thing);

    expect(thing.used).toBe(false);
  });

  it('ignoresAnObjectReleasedTwice', () => {
    const { pool } = thingPool();
    const thing = pool.acquire();

    pool.release(thing);
    pool.release(thing);

    expect(pool.idleCount).toBe(1);
    expect(pool.acquire()).toBe(thing);
    expect(pool.acquire()).not.toBe(thing);
  });

  it('countsTheIdleObjects', () => {
    const { pool } = thingPool();
    const items = [pool.acquire(), pool.acquire(), pool.acquire()];

    items.forEach((item) => pool.release(item));

    expect(pool.idleCount).toBe(3);
  });
});

describe('KeyedPool', () => {
  it('keepsAPoolPerKey', () => {
    const pool = new KeyedPool<string, { key: string }>(
      (key) => ({ key }),
      () => undefined,
    );
    const a = pool.acquire('a');
    const b = pool.acquire('b');

    pool.release('a', a);
    pool.release('b', b);

    expect(pool.acquire('a')).toBe(a);
    expect(pool.acquire('b')).toBe(b);
    expect(pool.acquire('a')).not.toBe(a);
  });
});
