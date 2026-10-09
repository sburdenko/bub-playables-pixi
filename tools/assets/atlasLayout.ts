import { MaxRectsPacker } from 'maxrects-packer';

export type PackInput = { readonly id: string; readonly width: number; readonly height: number };

export type Placement = { readonly id: string; readonly x: number; readonly y: number };

export type AtlasPage = { readonly width: number; readonly height: number; readonly placements: readonly Placement[] };

/** Packs rectangles into as few pages as possible; throws when one rectangle cannot fit a page at all. */
export function layoutAtlas(inputs: readonly PackInput[], maxSize: number, padding: number): AtlasPage[] {
  const tooLarge = inputs.find((input) => input.width > maxSize || input.height > maxSize);
  if (tooLarge !== undefined) {
    throw new Error(`Sprite '${tooLarge.id}' (${tooLarge.width}x${tooLarge.height}) exceeds the ${maxSize}px atlas; lower its scale.`);
  }

  const packer = new MaxRectsPacker(maxSize, maxSize, padding, { smart: true, pot: false, square: false, allowRotation: false, border: padding });
  for (const input of [...inputs].sort((left, right) => right.height - left.height || left.id.localeCompare(right.id))) {
    packer.add(input.width, input.height, input.id);
  }

  return packer.bins.map((bin) => ({
    width: bin.width,
    height: bin.height,
    placements: bin.rects.map((rect) => ({ id: String(rect.data), x: rect.x, y: rect.y })),
  }));
}
