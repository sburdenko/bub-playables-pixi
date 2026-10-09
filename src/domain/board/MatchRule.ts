import type { BoardGeometry } from './BoardGeometry';
import type { BubbleColor } from './BubbleColor';
import type { GridCell } from './GridCell';

export const MATCH_SIZE = 5;

export type ColorLookup = (target: GridCell) => BubbleColor | undefined;

/** The connected same-colour group around `origin` when it is big enough to pop, otherwise null. */
export function findMatch(geometry: BoardGeometry, colorAt: ColorLookup, origin: GridCell, minSize = MATCH_SIZE): readonly GridCell[] | null {
  const color = colorAt(origin);
  if (color === undefined) {
    return null;
  }

  const group = geometry.collectConnected(origin, (target) => colorAt(target) === color);

  return group.length >= minSize ? group : null;
}
