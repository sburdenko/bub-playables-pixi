export type PixelRect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export type Borders = { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };

export type ScaledSprite = {
  readonly width: number;
  readonly height: number;
  readonly pixelsPerUnit: number;
  readonly borders: Borders;
};

/**
 * Size, pixels-per-unit and nine-slice borders after resizing by `scale`.
 * Pixels-per-unit scales with the image, so the sprite keeps its world size.
 */
export function scaleSprite(sourceWidth: number, sourceHeight: number, scale: number, pixelsPerUnit: number, borders: Borders): ScaledSprite {
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const actualScale = width / sourceWidth;

  return {
    width,
    height,
    pixelsPerUnit: pixelsPerUnit * actualScale,
    borders: {
      left: Math.round(borders.left * actualScale),
      top: Math.round(borders.top * actualScale),
      right: Math.round(borders.right * actualScale),
      bottom: Math.round(borders.bottom * actualScale),
    },
  };
}

/**
 * Smallest rectangle holding every pixel with alpha > 0, or null for a fully transparent image.
 * Exact per pixel: unlike filtered trimming, isolated sparkles and faint glows are kept.
 */
export function alphaBounds(rgba: Uint8Array, width: number, height: number): PixelRect | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((rgba[(y * width + x) * 4 + 3] ?? 0) > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  return right < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
