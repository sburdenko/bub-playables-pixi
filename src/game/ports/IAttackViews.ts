import type { Vec2 } from '../../core/math/Vec2';

/** The glowing orb that the matched bubbles charge and that then flies into the enemy. */
export interface IOrbView {
  show(position: Vec2): void;
  moveTo(position: Vec2): void;
  setScale(scale: number): void;
  hide(): void;
}

/** The character the orb hits. */
export interface ITarget {
  readonly position: Vec2;
  playHit(): void;
}

export type BurstKind = 'trailingImpact' | 'enemyImpact' | 'energyBurst';

export type TextKind = 'score' | 'damage';

/** One-shot effects: particle bursts and floating numbers. */
export interface IEffects {
  spawnBurst(kind: BurstKind, position: Vec2, scale: number): void;
  spawnText(kind: TextKind, position: Vec2, value: number, layoutScale: number): void;
}
