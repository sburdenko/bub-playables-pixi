import { describe, expect, it } from 'vitest';
import { mixColor } from '../../../src/core/math/Color';

describe('mixColor', () => {
  it('returnsTheEndsAtZeroAndOne', () => {
    expect(mixColor(0x112233, 0xffeedd, 0)).toBe(0x112233);
    expect(mixColor(0x112233, 0xffeedd, 1)).toBe(0xffeedd);
  });

  it('blendsEveryChannelOnItsOwn', () => {
    expect(mixColor(0x000000, 0xff8040, 0.5)).toBe(0x804020);
  });

  it('clampsTheBlendFactor', () => {
    expect(mixColor(0x102030, 0x405060, -3)).toBe(0x102030);
    expect(mixColor(0x102030, 0x405060, 9)).toBe(0x405060);
  });
});
