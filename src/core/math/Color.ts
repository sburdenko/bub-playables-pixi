import { clamp01, lerp } from './Scalar';

const CHANNEL_SHIFTS = [16, 8, 0] as const;

/** Blends two 0xRRGGBB colours channel by channel; `t` is clamped to 0..1. */
export function mixColor(from: number, to: number, t: number): number {
  const amount = clamp01(t);

  return CHANNEL_SHIFTS.reduce<number>((mixed, shift) => {
    const channel = Math.round(lerp((from >> shift) & 0xff, (to >> shift) & 0xff, amount));

    return mixed | (channel << shift);
  }, 0);
}
