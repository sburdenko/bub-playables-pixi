import type { Vec2 } from '../../core/math/Vec2';
import type { IBubbleView } from './IBubbleView';
import type { PointerSample } from './IPointerSource';

export type Shot = { readonly bubble: IBubbleView; readonly position: Vec2; readonly velocity: Vec2 };

/** The part of the sling a turn needs: take a bubble, follow the pointer and hand back the shot once it is released. */
export interface ITurnLauncher {
  readonly isEmpty: boolean;
  load(bubble: IBubbleView): void;
  /** Returns the shot on the frame the player releases the pull, otherwise null. */
  update(pointer: PointerSample | null): Shot | null;
}
