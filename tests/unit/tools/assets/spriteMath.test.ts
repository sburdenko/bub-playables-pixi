import { describe, expect, it } from 'vitest';
import { alphaBounds, scaleSprite } from '../../../../tools/assets/spriteMath';

const NO_BORDERS = { left: 0, top: 0, right: 0, bottom: 0 };

describe('scaleSprite', () => {
  it('keepsWorldSizeByScalingPixelsPerUnit', () => {
    const scaled = scaleSprite(1650, 1566, 0.3, 100, NO_BORDERS);
    const worldWidthBefore = 1650 / 100;
    const worldWidthAfter = scaled.width / scaled.pixelsPerUnit;

    expect(scaled).toMatchObject({ width: 495, height: 470 });
    expect(worldWidthAfter).toBeCloseTo(worldWidthBefore, 10);
  });

  it('scalesNineSliceBorders', () => {
    const scaled = scaleSprite(320, 4540, 0.45, 100, { left: 0, top: 3340, right: 0, bottom: 664 });

    expect(scaled.borders).toEqual({ left: 0, top: 1503, right: 0, bottom: 299 });
  });

  it('neverProducesAnEmptyImage', () => {
    expect(scaleSprite(1, 1, 0.1, 100, NO_BORDERS)).toMatchObject({ width: 1, height: 1 });
  });
});

describe('alphaBounds', () => {
  function image(width: number, height: number, opaque: readonly [number, number, number][]): Uint8Array {
    const rgba = new Uint8Array(width * height * 4);
    for (const [x, y, alpha] of opaque) {
      rgba[(y * width + x) * 4 + 3] = alpha;
    }

    return rgba;
  }

  it('keepsIsolatedSinglePixelsAndFaintAlpha', () => {
    expect(alphaBounds(image(10, 10, [[1, 2, 1], [8, 7, 255]]), 10, 10)).toEqual({ x: 1, y: 2, width: 8, height: 6 });
  });

  it('returnsNullForAFullyTransparentImage', () => {
    expect(alphaBounds(image(4, 4, []), 4, 4)).toBeNull();
  });
});
