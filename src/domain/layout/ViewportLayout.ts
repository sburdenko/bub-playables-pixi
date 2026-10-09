import { rect, yMax, type Rect } from '../../core/math/Rect';

const REFERENCE_ASPECT = 1125 / 2436;
const REFERENCE_HALF_HEIGHT = 8.2;
const REFERENCE_WIDTH = REFERENCE_HALF_HEIGHT * 2 * REFERENCE_ASPECT;
const CAMERA_CENTER = { x: 0, y: 1 };

/** Screen-space rectangle in CSS pixels, Y down. */
export type ScreenRect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * Where the playable draws and what part of the world it shows. The 1125x2436 design area always fits: taller
 * screens reveal extra height, landscape screens are pillarboxed to the reference aspect.
 */
export type ViewportLayout = {
  /** Part of the screen the world is drawn into (the whole screen in portrait, a centred pillar in landscape). */
  readonly viewport: ScreenRect;
  /** World area visible on screen: full-bleed art covers this. */
  readonly visibleRect: Rect;
  /** World area gameplay is laid out in: never wider than the reference design. */
  readonly designRect: Rect;
  /** How much larger the visible area is than the reference screen. */
  readonly coverScale: number;
  readonly pixelsPerUnit: number;
};

export function computeViewportLayout(screenWidth: number, screenHeight: number): ViewportLayout {
  const screenAspect = screenHeight > 0 ? screenWidth / screenHeight : REFERENCE_ASPECT;
  const isPortrait = screenAspect <= 1;
  const aspect = isPortrait ? screenAspect : REFERENCE_ASPECT;
  const viewportWidth = isPortrait ? screenWidth : screenHeight * REFERENCE_ASPECT;
  const viewport = { x: (screenWidth - viewportWidth) / 2, y: 0, width: viewportWidth, height: screenHeight };

  const halfHeight = Math.max(REFERENCE_HALF_HEIGHT, (REFERENCE_WIDTH * 0.5) / aspect);
  const halfWidth = halfHeight * aspect;
  const visibleRect = rect(CAMERA_CENTER.x - halfWidth, CAMERA_CENTER.y - halfHeight, halfWidth * 2, halfHeight * 2);
  const designWidth = Math.min(visibleRect.width, REFERENCE_WIDTH);
  const designRect = rect(CAMERA_CENTER.x - designWidth / 2, visibleRect.yMin, designWidth, visibleRect.height);
  const coverScale = Math.max(visibleRect.width / REFERENCE_WIDTH, visibleRect.height / (REFERENCE_HALF_HEIGHT * 2));

  // Ad webviews can start at 0x0; a floor keeps the world-to-screen mapping invertible until they resize.
  return { viewport, visibleRect, designRect, coverScale, pixelsPerUnit: Math.max(screenHeight, 1) / visibleRect.height };
}

/** World point → CSS pixel, for hit-testing and debugging; the renderer applies the same mapping as a transform. */
export function worldToScreen(layout: ViewportLayout, x: number, y: number): { x: number; y: number } {
  return {
    x: layout.viewport.x + (x - layout.visibleRect.xMin) * layout.pixelsPerUnit,
    y: layout.viewport.y + (yMax(layout.visibleRect) - y) * layout.pixelsPerUnit,
  };
}

export function screenToWorld(layout: ViewportLayout, x: number, y: number): { x: number; y: number } {
  return {
    x: layout.visibleRect.xMin + (x - layout.viewport.x) / layout.pixelsPerUnit,
    y: yMax(layout.visibleRect) - (y - layout.viewport.y) / layout.pixelsPerUnit,
  };
}
