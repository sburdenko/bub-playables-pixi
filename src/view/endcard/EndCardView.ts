import { Container, Graphics, Rectangle } from 'pixi.js';
import { centerX, centerY } from '../../core/math/Rect';
import { worldToScreen, type ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { PlayButtonView } from './PlayButtonView';

const DIM_ALPHA = 0.6;
const FADE_SECONDS = 0.3;

type Visibility = { readonly kind: 'hidden' } | { readonly kind: 'shown'; readonly time: number };

/** Dims the game and offers the store, in screen space. Any tap on the card counts as the call to action. */
export class EndCardView extends Container {
  private readonly _dim = new Graphics();
  private readonly _button: PlayButtonView;
  private readonly _buttonRoot = new Container();
  private readonly _onInstall: () => void;
  private _visibility: Visibility = { kind: 'hidden' };

  constructor(textures: ITextureSource, onInstall: () => void) {
    super();
    this._onInstall = onInstall;
    this._button = new PlayButtonView(textures);
    this.visible = false;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => this._onInstall());
    this._buttonRoot.addChild(this._button);
    this.addChild(this._dim, this._buttonRoot);
  }

  get isShown(): boolean {
    return this._visibility.kind === 'shown';
  }

  show(): void {
    this._visibility = { kind: 'shown', time: 0 };
    this.visible = true;
    this.alpha = 0;
  }

  applyLayout(layout: ViewportLayout): void {
    const { viewport, designRect, pixelsPerUnit } = layout;
    this._dim.clear().rect(viewport.x, viewport.y, viewport.width, viewport.height).fill({ color: 0x000000, alpha: DIM_ALPHA });
    this.hitArea = new Rectangle(viewport.x, viewport.y, viewport.width, viewport.height);
    const center = worldToScreen(layout, centerX(designRect), centerY(designRect));
    this._buttonRoot.position.set(center.x, center.y);
    // The button is laid out in world units, Y up; this root maps those units to screen pixels.
    this._buttonRoot.scale.set(pixelsPerUnit, -pixelsPerUnit);
    this._button.applyLayout(designRect.width);
  }

  update(deltaSeconds: number): void {
    if (this._visibility.kind === 'hidden') {
      return;
    }

    const time = this._visibility.time + deltaSeconds;
    this._visibility = { kind: 'shown', time };
    this.alpha = Math.min(1, time / FADE_SECONDS);
    this._button.pulse(time);
  }
}
