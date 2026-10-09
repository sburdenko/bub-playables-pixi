import { xMax, yMax, type Rect } from '../../core/math/Rect';
import { distance, vec2, type Vec2 } from '../../core/math/Vec2';
import { cell, cellKey, isSameCell, type GridCell } from './GridCell';

const BASE_CELL_RADIUS = 0.35;
const BASE_SPACING_X = 0.75;
const BASE_SPACING_Y = 0.65;
const SIDE_MARGIN_IN_CELLS = 0.25;
const SIDE_PADDING = 0.25;
const TOP_PADDING = 0.825;
const NEIGHBOR_DISTANCE_TOLERANCE = 1.05;
const MAX_COLUMNS = 11;
const EXTRA_ROWS = 10;

/**
 * Immutable cell layout of the board for one design rect: where every cell is, which cells touch, and which cell a
 * flying bubble snaps into. Rows shorter than the widest row are centred, so a row one cell shorter sits half a
 * cell to the right (the honeycomb). Ten empty full rows below the level leave room for shots.
 */
export class BoardGeometry {
  readonly columns: number;
  readonly scale: number;
  readonly cellRadius: number;
  readonly spacingX: number;
  readonly spacingY: number;
  readonly leftWallX: number;
  readonly rightWallX: number;
  readonly topY: number;
  private readonly _rowWidths: readonly number[];
  private readonly _neighborDistance: number;

  constructor(levelRowWidths: readonly number[], designRect: Rect) {
    this.columns = Math.min(Math.max(0, ...levelRowWidths), MAX_COLUMNS);
    this._rowWidths = [...levelRowWidths.map((width) => Math.min(width, this.columns)), ...Array<number>(EXTRA_ROWS).fill(this.columns)];
    this.leftWallX = designRect.xMin + SIDE_PADDING;
    this.rightWallX = xMax(designRect) - SIDE_PADDING;
    const baseBoardWidth = (this.columns - 1 + SIDE_MARGIN_IN_CELLS * 2) * BASE_SPACING_X + BASE_CELL_RADIUS * 2;
    this.scale = (this.rightWallX - this.leftWallX) / baseBoardWidth;
    this.cellRadius = BASE_CELL_RADIUS * this.scale;
    this.spacingX = BASE_SPACING_X * this.scale;
    this.spacingY = BASE_SPACING_Y * this.scale;
    this.topY = yMax(designRect) - TOP_PADDING - this.cellRadius;
    this._neighborDistance = Math.hypot(this.spacingX, this.spacingY) * NEIGHBOR_DISTANCE_TOLERANCE;
  }

  get rowCount(): number {
    return this._rowWidths.length;
  }

  rowWidth(row: number): number {
    return this._rowWidths[row] ?? 0;
  }

  contains(target: GridCell): boolean {
    return target.row >= 0 && target.row < this.rowCount && target.column >= 0 && target.column < this.rowWidth(target.row);
  }

  cellPosition(target: GridCell): Vec2 {
    const rowShift = (this.columns - this.rowWidth(target.row)) * 0.5 * this.spacingX;
    const x = this.leftWallX + this.cellRadius + SIDE_MARGIN_IN_CELLS * this.spacingX + rowShift + target.column * this.spacingX;

    return vec2(x, this.topY - target.row * this.spacingY);
  }

  /** Cells in the rows above and below (and the same row) whose centres are one cell apart. */
  neighbors(target: GridCell): GridCell[] {
    const center = this.cellPosition(target);
    const rows = [target.row - 1, target.row, target.row + 1].filter((row) => row >= 0 && row < this.rowCount);

    return rows
      .flatMap((row) => Array.from({ length: this.rowWidth(row) }, (_, column) => cell(row, column)))
      .filter((candidate) => !isSameCell(candidate, target) && distance(center, this.cellPosition(candidate)) <= this._neighborDistance);
  }

  /** Breadth-first flood fill from `origin` through touching cells accepted by `isMember`. */
  collectConnected(origin: GridCell, isMember: (target: GridCell) => boolean): GridCell[] {
    if (!isMember(origin)) {
      return [];
    }

    const group: GridCell[] = [];
    const visited = new Set([cellKey(origin)]);
    const pending = [origin];
    for (let current = pending.shift(); current !== undefined; current = pending.shift()) {
      group.push(current);
      for (const neighbor of this.neighbors(current)) {
        const key = cellKey(neighbor);
        if (!visited.has(key) && isMember(neighbor)) {
          pending.push(neighbor);
        }

        visited.add(key);
      }
    }

    return group;
  }

  /** The available cell whose centre is nearest to `position`, or null when no cell is available. */
  findClosestCell(position: Vec2, isAvailable: (target: GridCell) => boolean): GridCell | null {
    let closest: GridCell | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let row = 0; row < this.rowCount; row++) {
      for (let column = 0; column < this.rowWidth(row); column++) {
        const candidate = cell(row, column);
        const candidateDistance = distance(position, this.cellPosition(candidate));
        if (candidateDistance < bestDistance && isAvailable(candidate)) {
          bestDistance = candidateDistance;
          closest = candidate;
        }
      }
    }

    return closest;
  }
}
