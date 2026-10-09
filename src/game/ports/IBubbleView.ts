import type { Vec2 } from '../../core/math/Vec2';
import type { BubbleColor } from '../../domain/board/BubbleColor';

/** What the board needs from a bubble on screen. Implemented by the view layer. */
export interface IBubbleView {
  readonly color: BubbleColor;
  /** Collision radius in world units at the current layout scale. */
  readonly radius: number;
  setLayoutScale(scale: number): void;
  /** Puts the bubble into a board cell and plays the spawn bounce. */
  place(rest: Vec2, row: number): void;
  /** Moves the cell's rest position (after a resize) without replaying the spawn bounce. */
  setRestPosition(rest: Vec2): void;
  /** Wobbles the bubble around its rest position. */
  applyImpact(direction: Vec2, strength: number): void;
  destroy(): void;
}

export interface IBubbleViewFactory {
  create(color: BubbleColor): IBubbleView;
}
