import { Container, NineSliceSprite, Sprite, type Texture } from 'pixi.js';
import { clamp01 } from '../../core/math/Scalar';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITimerView, TimerLook } from '../../game/ports/ITimerView';
import type { ITextureSource } from '../assets/ITextureSource';

const CANVAS_REFERENCE_HEIGHT = 2436;
const CANVAS_PIXELS_PER_UNIT = 100;
const BAR_OFFSET_FROM_TOP = 83.4;
const BAR_SCALE = 0.8;

/** A Unity UI image in canvas pixels (Y up), positioned by its pivot. */
type UiImage = {
  readonly textureId: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly size: { readonly width: number; readonly height: number };
  readonly pivot: { readonly x: number; readonly y: number };
  readonly isSliced: boolean;
};

const FILL_IMAGE: UiImage = { textureId: 'turntimer-frame-mask', position: { x: -289.4, y: 3 }, size: { width: 672.9, height: 128 }, pivot: { x: 0, y: 0.5 }, isSliced: true };

const OVERLAY_IMAGES: readonly UiImage[] = [
  { textureId: 't-gameui-turntimer-frame-hero', position: { x: 0, y: 0 }, size: { width: 826.8, height: 190 }, pivot: { x: 0.5, y: 0.5 }, isSliced: true },
  { textureId: 't-gameui-turntimer-icon-hero', position: { x: -335.5, y: 3 }, size: { width: 149, height: 180 }, pivot: { x: 0.5, y: 0.5 }, isSliced: false },
];

type BuiltImage = { readonly holder: Container; readonly graphic: Container; readonly width: number; readonly height: number };

/**
 * The top bar from the Unity canvas (screen-space, 1125x2436 reference, matched by height): a timer fill in a frame with
 * an icon. Children are laid out in canvas pixels; the bar scales canvas pixels to screen pixels. The fill is a
 * nine-slice, so it drains by getting narrower and keeps its rounded end; once it is narrower than its two rounded
 * ends it is squeezed as a whole until it disappears.
 */
export class TopBarView extends Container implements ITimerView {
  private readonly _fill: NineSliceSprite;
  private readonly _fillFullWidth: number;
  private readonly _fillMinWidth: number;

  constructor(textures: ITextureSource) {
    super();
    const fill = createImage(textures, FILL_IMAGE);
    if (!(fill.graphic instanceof NineSliceSprite)) {
      throw new Error('The timer fill must be a nine-slice sprite.');
    }

    this._fill = fill.graphic;
    this._fillFullWidth = fill.width;
    this._fillMinWidth = this._fill.leftWidth + this._fill.rightWidth;
    this.addChild(fill.holder, ...OVERLAY_IMAGES.map((image) => createImage(textures, image).holder));
  }

  show({ fractionLeft, tint }: TimerLook): void {
    const width = this._fillFullWidth * clamp01(fractionLeft);
    this._fill.width = Math.max(width, this._fillMinWidth);
    this._fill.scale.x = width < this._fillMinWidth ? width / this._fillMinWidth : 1;
    this._fill.visible = width > 0;
    this._fill.tint = tint;
  }

  /** Screen space, Y down: the bar hangs from the top edge of the viewport, scaled by the screen height. */
  applyLayout({ viewport }: ViewportLayout): void {
    const pixelsPerCanvasPixel = viewport.height / CANVAS_REFERENCE_HEIGHT;
    this.position.set(viewport.x + viewport.width / 2, viewport.y + BAR_OFFSET_FROM_TOP * pixelsPerCanvasPixel);
    // The canvas images are laid out Y up; flipping here keeps them upright in screen space.
    this.scale.set(BAR_SCALE * pixelsPerCanvasPixel, -BAR_SCALE * pixelsPerCanvasPixel);
  }
}

function createImage(textures: ITextureSource, image: UiImage): BuiltImage {
  const texture = textures.get(image.textureId);
  const textureScale = CANVAS_PIXELS_PER_UNIT / textures.pixelsPerUnit(image.textureId);
  const width = image.size.width / textureScale;
  const height = image.size.height / textureScale;
  const graphic = image.isSliced ? new NineSliceSprite({ texture, width, height }) : sizedSprite(texture, width, height);
  // Atlas frames carry a centred default anchor; UI images are positioned from their top-left corner instead.
  graphic.anchor.set(0);
  graphic.position.set(-image.pivot.x * width, -(1 - image.pivot.y) * height);

  const holder = new Container();
  holder.position.set(image.position.x, image.position.y);
  holder.scale.set(textureScale, -textureScale);
  holder.addChild(graphic);

  return { holder, graphic, width, height };
}

function sizedSprite(texture: Texture, width: number, height: number): Sprite {
  const sprite = new Sprite(texture);
  sprite.setSize(width, height);

  return sprite;
}
