import { Container, NineSliceSprite, Text } from 'pixi.js';
import type { ITextureSource } from '../assets/ITextureSource';

const BODY_TEXTURE = 'turntimer-frame-mask';
const SIZE = { widthOfDesign: 0.62, aspect: 0.3 };
const PULSE = { periodSeconds: 0.9, amount: 0.06 };
const LOOK = {
  bodyTint: 0x3cc84a,
  lipTint: 0x1c8a2b,
  rimTint: 0xffffff,
  lipOfHeight: 0.1,
  rimOfHeight: 0.06,
  glossAlpha: 0.3,
  glossInsetOfHeight: 0.08,
  glossOfHeight: 0.4,
};
const LABEL = { text: 'PLAY NOW', fontFamily: 'Lilita One', fontPixels: 100, heightOfButton: 0.5, outline: 0x1a5c22 };

type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * The call-to-action button, built from the timer fill's white nine-slice (tinted) instead of drawn shapes: a white rim,
 * a dark lip under the body, the green body with a gloss band, and the label. It pulses while it is shown.
 */
export class PlayButtonView extends Container {
  private readonly _textures: ITextureSource;

  constructor(textures: ITextureSource) {
    super();
    this._textures = textures;
  }

  /** Sizes the button from the width of the design area, in the world units of its parent. */
  applyLayout(designWidth: number): void {
    const width = designWidth * SIZE.widthOfDesign;
    const height = width * SIZE.aspect;
    this.removeChildren().forEach((child) => child.destroy());
    this.addChild(this.createSurface(width, height), this.createLabel(height));
  }

  /** Pulses once per period; `seconds` is the time since the button appeared. */
  pulse(seconds: number): void {
    this.scale.set(1 + PULSE.amount * Math.sin((seconds / PULSE.periodSeconds) * Math.PI * 2));
  }

  private createSurface(width: number, height: number): Container {
    const rim = height * LOOK.rimOfHeight;
    const lip = height * LOOK.lipOfHeight;
    const inset = height * LOOK.glossInsetOfHeight;
    const gloss = { height: height * LOOK.glossOfHeight, top: height / 2 - inset };
    const layers: readonly { readonly box: Box; readonly tint: number; readonly alpha: number }[] = [
      { box: { x: -width / 2 - rim, y: -height / 2 - lip - rim, width: width + 2 * rim, height: height + lip + 2 * rim }, tint: LOOK.rimTint, alpha: 1 },
      { box: { x: -width / 2, y: -height / 2 - lip, width, height }, tint: LOOK.lipTint, alpha: 1 },
      { box: { x: -width / 2, y: -height / 2, width, height }, tint: LOOK.bodyTint, alpha: 1 },
      { box: { x: -width / 2 + inset, y: gloss.top - gloss.height, width: width - 2 * inset, height: gloss.height }, tint: 0xffffff, alpha: LOOK.glossAlpha },
    ];
    const surface = new Container();
    surface.addChild(...layers.map((layer) => this.createSlice(layer.box, layer.tint, layer.alpha)));

    return surface;
  }

  /** A tinted nine-slice covering `box` (world units, Y up, `y` is its bottom edge). */
  private createSlice(box: Box, tint: number, alpha: number): NineSliceSprite {
    const unitsPerPixel = 1 / this._textures.pixelsPerUnit(BODY_TEXTURE);
    const slice = new NineSliceSprite({ texture: this._textures.get(BODY_TEXTURE), width: box.width / unitsPerPixel, height: box.height / unitsPerPixel });
    // Atlas frames carry a centred default anchor; the box is placed by its top-left corner instead.
    slice.anchor.set(0);
    slice.scale.set(unitsPerPixel, -unitsPerPixel);
    slice.position.set(box.x, box.y + box.height);
    slice.tint = tint;
    slice.alpha = alpha;

    return slice;
  }

  private createLabel(buttonHeight: number): Text {
    const label = new Text({
      text: LABEL.text,
      style: { fontFamily: LABEL.fontFamily, fontSize: LABEL.fontPixels, fill: 0xffffff, stroke: { color: LABEL.outline, width: 12, join: 'round' } },
      anchor: 0.5,
      resolution: 2,
    });
    const unitsPerPixel = (buttonHeight * LABEL.heightOfButton) / LABEL.fontPixels;
    label.scale.set(unitsPerPixel, -unitsPerPixel);

    return label;
  }
}
