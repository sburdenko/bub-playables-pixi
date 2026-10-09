import type { Vec2 } from '../../core/math/Vec2';
import type { BubbleColor } from '../../domain/board/BubbleColor';

/** What the board needs from a bubble on screen. Implemented by the view layer. */
export interface IBubbleView {
  readonly color: BubbleColor;
  /** Where the bubble is drawn right now, wobble included. */
  readonly position: Vec2;
  setLayoutScale(scale: number): void;
  /** Moves a bubble that is not on the board (in the sling or in flight). */
  setPosition(position: Vec2): void;
  /** Starts the in-flight look: spinning frames, no shadow. */
  playLaunch(): void;
  /** Puts the bubble into a board cell and plays the spawn bounce. */
  place(rest: Vec2, row: number): void;
  /** Moves the cell's rest position (after a resize) without replaying the spawn bounce. */
  setRestPosition(rest: Vec2): void;
  /** Wobbles the bubble around its rest position. */
  applyImpact(direction: Vec2, strength: number): void;
  /** Pop: squash, glow and fade the shadow. */
  playMatch(): void;
  /** Leaves the board to fly into the orb: drawn above everything, trailing sparkles. */
  beginCollect(): void;
  /** Returns to the plain look (end of the pop, before shrinking into the orb). */
  stopAnimation(): void;
  rotateBy(radians: number): void;
  /** Size relative to normal: 1 is full size, 0 is gone. */
  setShrink(factor: number): void;
  destroy(): void;
}

export interface IBubbleViewFactory {
  create(color: BubbleColor): IBubbleView;
}
