import { describe, expect, it } from 'vitest';
import { xMax } from '../../../src/core/math/Rect';
import { computeViewportLayout, screenToWorld, worldToScreen } from '../../../src/domain/layout/ViewportLayout';

const REFERENCE_WIDTH = 16.4 * (1125 / 2436);

describe('computeViewportLayout', () => {
  it('referenceScreen_showsExactlyTheDesignArea', () => {
    const layout = computeViewportLayout(1125, 2436);

    expect(layout.viewport).toEqual({ x: 0, y: 0, width: 1125, height: 2436 });
    expect(layout.visibleRect.height).toBeCloseTo(16.4, 10);
    expect(layout.visibleRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
    expect(layout.visibleRect.yMin).toBeCloseTo(-7.2, 10);
    expect(layout.designRect).toEqual(layout.visibleRect);
    expect(layout.coverScale).toBeCloseTo(1, 10);
    expect(layout.pixelsPerUnit).toBeCloseTo(2436 / 16.4, 10);
  });

  it('tallerPhone_revealsExtraHeightAndKeepsTheDesignWidth', () => {
    const layout = computeViewportLayout(390, 900);

    expect(layout.visibleRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
    expect(layout.visibleRect.height).toBeGreaterThan(16.4);
    expect(layout.designRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
    expect(layout.coverScale).toBeGreaterThan(1);
  });

  it('widerPortrait_revealsExtraSidesButCapsTheDesignWidth', () => {
    const layout = computeViewportLayout(768, 1024);

    expect(layout.visibleRect.height).toBeCloseTo(16.4, 10);
    expect(layout.visibleRect.width).toBeGreaterThan(REFERENCE_WIDTH);
    expect(layout.designRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
    expect(layout.designRect.xMin + layout.designRect.width / 2).toBeCloseTo(0, 10);
  });

  it('landscape_isPillarboxedToTheReferenceAspect', () => {
    const layout = computeViewportLayout(1600, 900);

    expect(layout.viewport.height).toBe(900);
    expect(layout.viewport.width).toBeCloseTo(900 * (1125 / 2436), 10);
    expect(layout.viewport.x).toBeCloseTo((1600 - layout.viewport.width) / 2, 10);
    expect(layout.visibleRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
  });

  it('zeroHeightScreen_fallsBackToTheReferenceAspect', () => {
    expect(computeViewportLayout(100, 0).visibleRect.width).toBeCloseTo(REFERENCE_WIDTH, 10);
  });
});

describe('world and screen mapping', () => {
  const layout = computeViewportLayout(1600, 900);

  it('visibleCornersMapToViewportCorners', () => {
    const topLeft = worldToScreen(layout, layout.visibleRect.xMin, layout.visibleRect.yMin + layout.visibleRect.height);
    const bottomRight = worldToScreen(layout, xMax(layout.visibleRect), layout.visibleRect.yMin);

    expect(topLeft.x).toBeCloseTo(layout.viewport.x, 10);
    expect(topLeft.y).toBeCloseTo(0, 10);
    expect(bottomRight.x).toBeCloseTo(layout.viewport.x + layout.viewport.width, 10);
    expect(bottomRight.y).toBeCloseTo(900, 10);
  });

  it('roundTripsAPoint', () => {
    const world = screenToWorld(layout, 812, 333);
    const screen = worldToScreen(layout, world.x, world.y);

    expect(screen.x).toBeCloseTo(812, 10);
    expect(screen.y).toBeCloseTo(333, 10);
  });
});
