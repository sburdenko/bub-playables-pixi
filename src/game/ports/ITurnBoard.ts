import type { Vec2 } from '../../core/math/Vec2';
import type { IRandom } from '../../core/random/IRandom';
import type { GridCell } from '../../domain/board/GridCell';
import type { IBubbleView } from './IBubbleView';

/** How a shot ended: where it landed (null when the board was full) and the bubbles it matched, now off the board. */
export type Settlement = { readonly landedAt: GridCell | null; readonly matched: readonly IBubbleView[] };

/** The part of the board a turn needs: make the next projectile, fire it and learn how it settled. */
export interface ITurnBoard {
  /** Scale of the board's bubbles against the design size; the attack sizes its flying bubbles by it. */
  readonly layoutScale: number;
  createProjectile(random: IRandom): IBubbleView;
  launch(bubble: IBubbleView, position: Vec2, velocity: Vec2): void;
  /** Advances the flight; returns how the shot ended on the frame it did, otherwise null. */
  update(deltaSeconds: number): Settlement | null;
}
