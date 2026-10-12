import { Container, Graphics, Rectangle } from 'pixi.js';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { PlayButtonView } from './PlayButtonView';

const SORT_ORDER = 1000;
const DIM_ALPHA = 0.6;
const FADE_SECONDS = 0.3;

type Visibility = { readonly kind: 'hidden' } | { readonly kind: 'shown'; readonly time: number };

/** Dims the game and offers the store. Any tap on the card counts as the call to action. */
export class EndCardView extends Container {
  private readonly _dim = new Graphics();
  private readonly _button: PlayButtonView;
  private readonly _onInstall: () => void;
  private _visibility: Visibility = { kind: 'hidden' };

  constructor(textures: ITextureSource, onInstall: () => void) {
    super();
    this._onInstall = onInstall;
    this._button = new PlayButtonView(textures);
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
    this._button.applyLayout(designRect);
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
