import { describe, expect, it } from 'vitest';
import { RecyclingPool } from '../../../src/core/pool/RecyclingPool';

class Item {
  isDestroyed = false;
  resets = 0;

  constructor(readonly key: string) {}
}

function setUp() {
  const created: Item[] = [];
  const pool = new RecyclingPool<string, Item>(
    (key) => {
      const item = new Item(key);
      created.push(item);

      return item;
    },
    (item) => {
      item.isDestroyed = false;
      item.resets++;
    },
    (item) => item.key,
  );

  return { pool, created };
}

describe('RecyclingPool', () => {
  it('tracksAcquiredItemsAsActive', () => {
    const { pool } = setUp();
    const red = pool.acquire('red');
    const blue = pool.acquire('blue');

    expect(pool.active).toEqual([red, blue]);
  });

  it('takesBackDestroyedItemsAndStopsTrackingThemOnce', () => {
    const { pool } = setUp();
    const red = pool.acquire('red');
    const blue = pool.acquire('blue');
    red.isDestroyed = true;

    pool.sweep();

    expect(pool.active).toEqual([blue]);
    expect(red.isDestroyed).toBe(false);
    pool.sweep();
    expect(pool.active).toEqual([blue]);
    expect(red.resets).toBe(1);
  });

  it('reusesATakenBackItemOfTheSameKeyOnly', () => {
    const { pool, created } = setUp();
    const red = pool.acquire('red');
    red.isDestroyed = true;
    pool.sweep();

    expect(pool.acquire('blue')).not.toBe(red);
    expect(pool.acquire('red')).toBe(red);
    expect(created).toHaveLength(2);
    expect(pool.active.filter((item) => item === red)).toHaveLength(1);
  });
});
