import type { Vec2 } from '../../core/math/Vec2';
import type { BubbleColor } from '../../domain/board/BubbleColor';

/** What the launcher needs from the sling on screen: bands, aim line and pull glow. */
export interface ISlingView {
  setAnchor(anchor: Vec2): void;
  setAimColor(color: BubbleColor): void;
  /** Bands to the resting pocket, no aim line. */
  showLoaded(pocket: Vec2): void;
  /** Bands to the pulled pocket, aim line `aim` long from it, glow by pull `strength` (0..1). */
  showAim(pocket: Vec2, aim: Vec2, strength: number, layoutScale: number): void;
  /** Bands snap back from `pocket` to the anchor. */
  release(pocket: Vec2, layoutScale: number): void;
}
