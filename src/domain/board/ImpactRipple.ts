import { degreesToRadians } from '../../core/math/Scalar';
import { dot, length, scale, subtract, type Vec2 } from '../../core/math/Vec2';
import type { BoardGeometry } from './BoardGeometry';
import { cellKey, isSameCell, type GridCell } from './GridCell';

const RIPPLE_RADIUS_IN_CELLS = 6.5;
const RIPPLE_STRENGTH = 1.2;
const RIPPLE_CONE_HALF_ANGLE_DEGREES = 30;

export type Impulse = { readonly cell: GridCell; readonly direction: Vec2; readonly strength: number };

/**
 * Pushes that a landing bubble sends through the bubbles around it. Direct neighbours of the landing cell are always
 * pushed; further out the wave only travels within a cone around the flight direction, and it fades with distance.
 */
export function computeRipple(
  geometry: BoardGeometry,
  isOccupied: (target: GridCell) => boolean,
  source: GridCell,
  flightDirection: Vec2,
): Impulse[] {
  const center = geometry.cellPosition(source);
  const radius = geometry.spacingX * RIPPLE_RADIUS_IN_CELLS;
  const minAlignment = Math.cos(degreesToRadians(RIPPLE_CONE_HALF_ANGLE_DEGREES));
  const impulses: Impulse[] = [];
  const visited = new Set([cellKey(source)]);
  const pending = [source];

  for (let current = pending.shift(); current !== undefined; current = pending.shift()) {
    const isSource = isSameCell(current, source);
    for (const neighbor of geometry.neighbors(current)) {
      if (visited.has(cellKey(neighbor)) || !isOccupied(neighbor)) {
        continue;
      }

      const offset = subtract(geometry.cellPosition(neighbor), center);
      const offsetLength = length(offset);
      const pushDirection = scale(offset, 1 / offsetLength);
      if (offsetLength > radius || (!isSource && dot(pushDirection, flightDirection) < minAlignment)) {
        continue;
      }

      visited.add(cellKey(neighbor));
      pending.push(neighbor);
      impulses.push({ cell: neighbor, direction: pushDirection, strength: RIPPLE_STRENGTH * geometry.scale * (1 - offsetLength / radius) });
    }
  }

  return impulses;
}
