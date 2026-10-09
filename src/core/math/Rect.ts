/** Axis-aligned rectangle in world units, Y up: (`xMin`, `yMin`) is the bottom-left corner. */
export type Rect = { readonly xMin: number; readonly yMin: number; readonly width: number; readonly height: number };

export function rect(xMin: number, yMin: number, width: number, height: number): Rect {
  return { xMin, yMin, width, height };
}

export function xMax(area: Rect): number {
  return area.xMin + area.width;
}

export function yMax(area: Rect): number {
  return area.yMin + area.height;
}

export function centerX(area: Rect): number {
  return area.xMin + area.width / 2;
}

export function centerY(area: Rect): number {
  return area.yMin + area.height / 2;
}
