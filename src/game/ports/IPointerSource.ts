import type { Vec2 } from '../../core/math/Vec2';

/** The first touch (or the mouse) for one frame, in world units. */
export type PointerSample = {
  readonly world: Vec2;
  /** Where the press happened, on the frame it happened; a press and a drag can land in the same frame. */
  readonly pressWorld: Vec2 | null;
  readonly isPressedThisFrame: boolean;
  readonly isHeld: boolean;
  readonly isReleasedThisFrame: boolean;
};

export interface IPointerSource {
  /** This frame's pointer, or null when nothing is touching. Call once per frame. */
  poll(): PointerSample | null;
}
