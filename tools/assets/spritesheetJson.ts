import type { AtlasPage } from './atlasLayout';

/** A sprite after resize and trim: `trim` is where the kept pixels sit inside the untrimmed (scaled) sprite. */
export type ProcessedSprite = {
  readonly id: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly trim: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly anchor: { readonly x: number; readonly y: number };
  readonly borders: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
};

type Rect = { x: number; y: number; w: number; h: number };

export type SpritesheetFrame = {
  readonly frame: Rect;
  readonly rotated: false;
  readonly trimmed: boolean;
  readonly spriteSourceSize: Rect;
  readonly sourceSize: { w: number; h: number };
  readonly anchor: { x: number; y: number };
  readonly borders?: { left: number; top: number; right: number; bottom: number };
};

export type SpritesheetData = {
  readonly frames: Readonly<Record<string, SpritesheetFrame>>;
  readonly meta: { readonly image: string; readonly size: { w: number; h: number }; readonly scale: number };
};

/** Builds the TexturePacker-style JSON that Pixi's `Spritesheet` parses (trim, anchor and nine-slice borders included). */
export function buildSpritesheet(page: AtlasPage, imageName: string, sprites: ReadonlyMap<string, ProcessedSprite>): SpritesheetData {
  const frames = Object.fromEntries(
    page.placements.map((placement) => {
      const sprite = sprites.get(placement.id);
      if (sprite === undefined) {
        throw new Error(`Placed sprite '${placement.id}' has no processed image.`);
      }

      return [placement.id, toFrame(placement.x, placement.y, sprite)];
    }),
  );

  return { frames, meta: { image: imageName, size: { w: page.width, h: page.height }, scale: 1 } };
}

function toFrame(x: number, y: number, sprite: ProcessedSprite): SpritesheetFrame {
  const { trim } = sprite;
  const hasBorders = Object.values(sprite.borders).some((value) => value > 0);
  const frame: SpritesheetFrame = {
    frame: { x, y, w: trim.width, h: trim.height },
    rotated: false,
    trimmed: trim.width !== sprite.sourceWidth || trim.height !== sprite.sourceHeight,
    spriteSourceSize: { x: trim.x, y: trim.y, w: trim.width, h: trim.height },
    sourceSize: { w: sprite.sourceWidth, h: sprite.sourceHeight },
    anchor: { ...sprite.anchor },
  };

  return hasBorders ? { ...frame, borders: { ...sprite.borders } } : frame;
}
