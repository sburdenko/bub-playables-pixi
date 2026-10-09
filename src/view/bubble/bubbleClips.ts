import { keys } from '../../domain/animation/Keyframes';
import type { BubbleColor } from '../../domain/board/BubbleColor';

/** Spawn bounce on the bubble's anchor scale, from the Unity clip A_Normal_Spawn (0.25 s). */
export const SPAWN_CLIP = {
  duration: 0.25,
  scaleX: keys([0, 1], [0.0667, 1.1], [0.1, 0.95], [0.15, 1.2], [0.1833, 0.9], [0.25, 1]),
  scaleY: keys([0, 1], [0.0667, 1.1], [0.1, 0.95, -2.4], [0.15, 0.9], [0.1833, 1], [0.25, 1]),
} as const;

/** Pop from the Unity clip A_Normal_Match (0.4167 s): squash, additive flash, shadow fades at once. */
export const MATCH_CLIP = {
  duration: 0.4167,
  scaleX: keys([0, 1], [0.1, 1.16], [0.2, 1], [0.2833, 1.12], [0.3333, 1, -3.6], [0.4167, 0.5511]),
  scaleY: keys([0, 1], [0.1, 1], [0.2, 1.22], [0.2833, 0.95], [0.3333, 1], [0.4167, 0.5834]),
  flashAlpha: keys([0, 0], [0.1167, 1], [0.3333, 1], [0.4167, 0]),
  shadowAlpha: keys([0, 1], [0.05, 0]),
} as const;

const SPIN_FRAME_NUMBERS = ['0001', '0002', '0003', '0005', '0007', '0008', '0010', '0012', '0013', '0014'];

/** In-flight spin from the Unity clips A_NormalN_Spin: 10 frames at 30 fps, looping, shadow hidden. */
export const SPIN_CLIP = {
  duration: 0.3167,
  frameSeconds: 1 / 30,
  imageScale: 0.32,
  frames: (color: BubbleColor): readonly string[] => SPIN_FRAME_NUMBERS.map((frame) => `t-normal-${color}-spin-${frame}`),
} as const;

/** Colour of the aim line per bubble colour (the Bubble prefab's `_aimColor`). */
export const AIM_COLORS: Readonly<Record<BubbleColor, number>> = {
  red: 0xff5959,
  blue: 0x479eff,
  green: 0x52e675,
  yellow: 0xffd138,
};
