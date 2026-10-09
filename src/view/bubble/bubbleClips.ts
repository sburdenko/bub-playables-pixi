import { keys } from '../../domain/animation/Keyframes';

/** Spawn bounce on the bubble's anchor scale, from the Unity clip A_Normal_Spawn (0.25 s). */
export const SPAWN_CLIP = {
  duration: 0.25,
  scaleX: keys([0, 1], [0.0667, 1.1], [0.1, 0.95], [0.15, 1.2], [0.1833, 0.9], [0.25, 1]),
  scaleY: keys([0, 1], [0.0667, 1.1], [0.1, 0.95, -2.4], [0.15, 0.9], [0.1833, 1], [0.25, 1]),
} as const;
