import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { centerX, centerY, type Rect } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import { sortOrder } from '../scene/sortOrder';

const SORT_ORDER = 1000;
const DIM_ALPHA = 0.6;
const FADE_SECONDS = 0.3;
const PULSE = { periodSeconds: 0.9, amount: 0.06 };
const BUTTON = { widthOfDesign: 0.62, aspect: 0.3, cornerOfHeight: 0.45, color: 0x3cc84a, outline: 0xffffff };
const LABEL = { text: 'PLAY NOW', fontFamily: 'Comic Roasting', fontPixels: 100, heightOfButton: 0.5, outline: 0x1a5c22 };

type Visibility = { readonly kind: 'hidden' } | { readonly kind: 'shown'; readonly time: number };

/** Dims the game and offers the store. Any tap on the card counts as the call to action. */
export class EndCardView extends Container {
  private readonly _dim = new Graphics();
  private readonly _button = new Container();
  private readonly _onInstall: () => void;
  private _visibility: Visibility = { kind: 'hidden' };

  constructor(onInstall: () => void) {
    super();
    this._onInstall = onInstall;
    this.zIndex = sortOrder(SORT_ORDER, 'top');
    this.visible = false;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => this._onInstall());
    this.addChild(this._dim, this._button);
  }

  get isShown(): boolean {
    return this._visibility.kind === 'shown';
  }

  show(): void {
    this._visibility = { kind: 'shown', time: 0 };
    this.visible = true;
    this.alpha = 0;
  }

  applyLayout({ visibleRect, designRect }: ViewportLayout): void {
    this._dim.clear().rect(visibleRect.xMin, visibleRect.yMin, visibleRect.width, visibleRect.height).fill({ color: 0x000000, alpha: DIM_ALPHA });
    this.hitArea = new Rectangle(visibleRect.xMin, visibleRect.yMin, visibleRect.width, visibleRect.height);
    this.drawButton(designRect);
  }

  update(deltaSeconds: number): void {
    if (this._visibility.kind === 'hidden') {
      return;
    }

    const time = this._visibility.time + deltaSeconds;
    this._visibility = { kind: 'shown', time };
    this.alpha = Math.min(1, time / FADE_SECONDS);
    this._button.scale.set(1 + PULSE.amount * Math.sin((time / PULSE.periodSeconds) * Math.PI * 2));
  }

  private drawButton(designRect: Rect): void {
    const width = designRect.width * BUTTON.widthOfDesign;
    const height = width * BUTTON.aspect;
    const shape = new Graphics()
      .roundRect(-width / 2, -height / 2, width, height, height * BUTTON.cornerOfHeight)
      .fill(BUTTON.color)
      .stroke({ color: BUTTON.outline, width: height * 0.06 });
    const label = new Text({
      text: LABEL.text,
      style: { fontFamily: LABEL.fontFamily, fontSize: LABEL.fontPixels, fill: 0xffffff, stroke: { color: LABEL.outline, width: 12, join: 'round' } },
      anchor: 0.5,
      resolution: 2,
    });
    const unitsPerPixel = (height * LABEL.heightOfButton) / LABEL.fontPixels;
    label.scale.set(unitsPerPixel, -unitsPerPixel);
    this._button.removeChildren().forEach((child) => child.destroy());
    this._button.addChild(shape, label);
    this._button.position.set(centerX(designRect), centerY(designRect));
  }
}
