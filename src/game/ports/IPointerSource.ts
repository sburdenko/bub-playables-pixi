import type { Vec2 } from '../../core/math/Vec2';

/** The first touch (or the mouse) for one frame, in world units. */
export type PointerSample = {
  readonly world: Vec2;
  readonly isPressedThisFrame: boolean;
  readonly isHeld: boolean;
  readonly isReleasedThisFrame: boolean;
};

export interface IPointerSource {
  /** This frame's pointer, or null when nothing is touching. Call once per frame. */
  poll(): PointerSample | null;
}
