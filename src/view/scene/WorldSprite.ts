import { Container, Sprite } from 'pixi.js';
import type { ITextureSource } from '../assets/ITextureSource';

/**
 * A sprite measured in world units inside the Y-up world: position, scale and rotation behave like a Unity transform.
 * The inner sprite undoes the world's vertical flip and converts texture pixels to world units.
 */
export class WorldSprite extends Container {
  private readonly _textures: ITextureSource;
  private readonly _sprite: Sprite;
  private _textureId: string;

  constructor(textures: ITextureSource, textureId: string) {
    super();
    this._textures = textures;
    this._textureId = textureId;
    this._sprite = new Sprite(textures.get(textureId));
    this.applyTextureScale();
    this.addChild(this._sprite);
  }

  /** Size in world units at scale 1, like Unity's `sprite.bounds.size`. */
  get naturalWidth(): number {
    return this._sprite.texture.width / this._textures.pixelsPerUnit(this._textureId);
  }

  get naturalHeight(): number {
    return this._sprite.texture.height / this._textures.pixelsPerUnit(this._textureId);
  }

  /** Swaps the frame; the anchor follows the new frame's pivot, which Pixi only applies in the constructor. */
  setTexture(textureId: string): void {
    const texture = this._textures.get(textureId);
    this._textureId = textureId;
    this._sprite.texture = texture;
    this._sprite.anchor.copyFrom(texture.defaultAnchor ?? { x: 0, y: 0 });
    this.applyTextureScale();
  }

  /** Stretches to `width` x `height` world units (Unity's sliced/tiled `size` with zero borders). */
  setWorldSize(width: number, height: number): void {
    this.scale.set(width / this.naturalWidth, height / this.naturalHeight);
  }

  setTint(color: number): void {
    this._sprite.tint = color;
  }

  private applyTextureScale(): void {
    const unitsPerPixel = 1 / this._textures.pixelsPerUnit(this._textureId);
    this._sprite.scale.set(unitsPerPixel, -unitsPerPixel);
  }
}
