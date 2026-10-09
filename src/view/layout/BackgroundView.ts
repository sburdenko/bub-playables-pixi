import { centerX, centerY } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';

const TEXTURE_ID = 'background';
const SORT_ORDER = -20;

/** Full-bleed background: the art is already cropped to the visible region, so it simply covers the screen. */
export class BackgroundView extends WorldSprite {
  constructor(textures: ITextureSource) {
    super(textures, TEXTURE_ID);
    this.zIndex = sortOrder(SORT_ORDER);
  }

  applyLayout({ visibleRect }: ViewportLayout): void {
    this.scale.set(Math.max(visibleRect.width / this.naturalWidth, visibleRect.height / this.naturalHeight));
    this.position.set(centerX(visibleRect), centerY(visibleRect));
  }
}
