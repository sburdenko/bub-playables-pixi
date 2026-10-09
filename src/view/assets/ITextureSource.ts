import type { Texture } from 'pixi.js';

/** Where views get their textures. Implemented by the platform asset loader and wired in the composition root. */
export interface ITextureSource {
  readonly ids: readonly string[];
  get(id: string): Texture;
  /** Pixels per world unit: a sprite's world size is its pixel size divided by this. */
  pixelsPerUnit(id: string): number;
}
