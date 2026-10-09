import { Container } from 'pixi.js';
import { centerX, centerY, xMax, yMax } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';

const SORT_ORDER = 100;
const TOP_WIDTH_RATIO = 0.6955124;
const TOP_HEIGHT_RATIO = 0.17324212;
const TOP_CENTER_FROM_TOP_HEIGHT_RATIO = 0.45;

/** Side frames stretched to the design height (the right one mirrored) and the top frame fitted to the design width. */
export class FrameView extends Container {
  private readonly _left: WorldSprite;
  private readonly _right: WorldSprite;
  private readonly _top: WorldSprite;

  constructor(textures: ITextureSource) {
    super();
    this._left = new WorldSprite(textures, 'gameplayframeside');
    this._right = new WorldSprite(textures, 'gameplayframeside');
    this._top = new WorldSprite(textures, 'gameplayframetop');
    this.zIndex = sortOrder(SORT_ORDER);
    this.addChild(this._left, this._right, this._top);
  }

  applyLayout({ designRect }: ViewportLayout): void {
    const sideScale = designRect.height / this._left.naturalHeight;
    const sideHalfWidth = (this._left.naturalWidth * sideScale) / 2;
    this._left.position.set(designRect.xMin + sideHalfWidth, centerY(designRect));
    this._left.scale.set(sideScale);
    this._right.position.set(xMax(designRect) - sideHalfWidth, centerY(designRect));
    this._right.scale.set(-sideScale, sideScale);

    const topHeight = designRect.width * TOP_HEIGHT_RATIO;
    this._top.setWorldSize(designRect.width * TOP_WIDTH_RATIO, topHeight);
    this._top.position.set(centerX(designRect), yMax(designRect) - topHeight * TOP_CENTER_FROM_TOP_HEIGHT_RATIO);
  }
}
