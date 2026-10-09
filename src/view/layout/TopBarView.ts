import { Container, NineSliceSprite, Sprite, type Texture } from 'pixi.js';
import { centerX, yMax } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';

const SORT_ORDER = 300;
const CANVAS_REFERENCE_HEIGHT = 2436;
const CANVAS_PIXELS_PER_UNIT = 100;
const BAR_OFFSET_FROM_TOP = 83.4;
const BAR_SCALE = 0.8;
const FILL_TINT = 0x3f498f;

/** A Unity UI image in canvas pixels (Y up), positioned by its pivot. */
type UiImage = {
  readonly textureId: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly size: { readonly width: number; readonly height: number };
  readonly pivot: { readonly x: number; readonly y: number };
  readonly isSliced: boolean;
  readonly tint?: number;
};

const IMAGES: readonly UiImage[] = [
  { textureId: 'turntimer-frame-mask', position: { x: -289.4, y: 3 }, size: { width: 672.9, height: 128 }, pivot: { x: 0, y: 0.5 }, isSliced: true, tint: FILL_TINT },
  { textureId: 't-gameui-turntimer-frame-hero', position: { x: 0, y: 0 }, size: { width: 826.8, height: 190 }, pivot: { x: 0.5, y: 0.5 }, isSliced: true },
  { textureId: 't-gameui-turntimer-icon-hero', position: { x: -335.5, y: 3 }, size: { width: 149, height: 180 }, pivot: { x: 0.5, y: 0.5 }, isSliced: false },
];

/**
 * Static "your turn" bar from the Unity canvas (screen-space, 1125x2436 reference, matched by height). Children are
 * laid out in canvas pixels; the bar scales canvas pixels to world units.
 */
export class TopBarView extends Container {
  constructor(textures: ITextureSource) {
    super();
    this.zIndex = sortOrder(SORT_ORDER);
    this.addChild(...IMAGES.map((image) => createImage(textures, image)));
  }

  applyLayout({ visibleRect }: ViewportLayout): void {
    const unitsPerCanvasPixel = visibleRect.height / CANVAS_REFERENCE_HEIGHT;
    this.position.set(centerX(visibleRect), yMax(visibleRect) - BAR_OFFSET_FROM_TOP * unitsPerCanvasPixel);
    this.scale.set(BAR_SCALE * unitsPerCanvasPixel);
  }
}

function createImage(textures: ITextureSource, image: UiImage): Container {
  const texture = textures.get(image.textureId);
  const textureScale = CANVAS_PIXELS_PER_UNIT / textures.pixelsPerUnit(image.textureId);
  const width = image.size.width / textureScale;
  const height = image.size.height / textureScale;
  const graphic = image.isSliced ? new NineSliceSprite({ texture, width, height }) : sizedSprite(texture, width, height);
  // Atlas frames carry a centred default anchor; UI images are positioned from their top-left corner instead.
  graphic.anchor.set(0);
  graphic.position.set(-image.pivot.x * width, -(1 - image.pivot.y) * height);
  graphic.tint = image.tint ?? 0xffffff;

  const holder = new Container();
  holder.position.set(image.position.x, image.position.y);
  holder.scale.set(textureScale, -textureScale);
  holder.addChild(graphic);

  return holder;
}

function sizedSprite(texture: Texture, width: number, height: number): Sprite {
  const sprite = new Sprite(texture);
  sprite.setSize(width, height);

  return sprite;
}
