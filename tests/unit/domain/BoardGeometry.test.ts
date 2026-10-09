import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { BoardGeometry } from '../../../src/domain/board/BoardGeometry';
import { cell, type GridCell } from '../../../src/domain/board/GridCell';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);
const sorted = (cells: readonly GridCell[]) => [...cells].sort((a, b) => a.row - b.row || a.column - b.column);

describe('BoardGeometry (ported from Unity)', () => {
  it('columns_areCappedAtEleven', () => {
    const geometry = new BoardGeometry([14, 3], DESIGN_RECT);

    expect(geometry.columns).toBe(11);
    expect(geometry.rowWidth(0)).toBe(11);
  });

  it('rowCount_addsTenFreeRowsBelowTheLevel', () => {
    const geometry = new BoardGeometry([11, 10], DESIGN_RECT);

    expect(geometry.rowCount).toBe(12);
    expect(geometry.rowWidth(11)).toBe(11);
  });

  it('shorterRow_isShiftedByHalfACell', () => {
    const geometry = new BoardGeometry([11, 10], DESIGN_RECT);

    expect(geometry.cellPosition(cell(1, 0)).x - geometry.cellPosition(cell(0, 0)).x).toBeCloseTo(geometry.spacingX * 0.5, 4);
  });

  it('board_fitsBetweenWallsWithQuarterCellMargins', () => {
    const geometry = new BoardGeometry([11], DESIGN_RECT);
    const firstLeftEdge = geometry.cellPosition(cell(0, 0)).x - geometry.cellRadius;
    const lastRightEdge = geometry.cellPosition(cell(0, 10)).x + geometry.cellRadius;

    expect(firstLeftEdge - geometry.leftWallX).toBeCloseTo(geometry.spacingX * 0.25, 4);
    expect(geometry.rightWallX - lastRightEdge).toBeCloseTo(geometry.spacingX * 0.25, 4);
  });

  it('contains_rejectsColumnsBeyondShortRow', () => {
    const geometry = new BoardGeometry([11, 10], DESIGN_RECT);

    expect(geometry.contains(cell(1, 9))).toBe(true);
    expect(geometry.contains(cell(1, 10))).toBe(false);
    expect(geometry.contains(cell(-1, 0))).toBe(false);
  });

  it('neighbors_inStaggeredRows_formHoneycomb', () => {
    const geometry = new BoardGeometry([11, 10, 11], DESIGN_RECT);

    expect(sorted(geometry.neighbors(cell(1, 4)))).toEqual(sorted([cell(0, 4), cell(0, 5), cell(1, 3), cell(1, 5), cell(2, 4), cell(2, 5)]));
  });

  it('neighbors_inAlignedRows_includeDiagonals', () => {
    const geometry = new BoardGeometry([11, 11], DESIGN_RECT);

    expect(sorted(geometry.neighbors(cell(0, 4)))).toEqual(sorted([cell(0, 3), cell(0, 5), cell(1, 3), cell(1, 4), cell(1, 5)]));
  });

  it('collectConnected_stopsAtNonMembers', () => {
    const geometry = new BoardGeometry([11], DESIGN_RECT);
    const members = new Set(['0:0', '0:1', '0:3']);

    const group = geometry.collectConnected(cell(0, 0), (target) => members.has(`${target.row}:${target.column}`));

    expect(sorted(group)).toEqual([cell(0, 0), cell(0, 1)]);
  });

  it('collectConnected_fromNonMember_isEmpty', () => {
    expect(new BoardGeometry([11], DESIGN_RECT).collectConnected(cell(0, 0), () => false)).toEqual([]);
  });

  it('findClosestCell_skipsUnavailableCells', () => {
    const geometry = new BoardGeometry([11], DESIGN_RECT);
    const occupied = cell(0, 5);

    const closest = geometry.findClosestCell(geometry.cellPosition(occupied), (target) => !(target.row === 0 && target.column === 5));

    expect(closest).toEqual(cell(1, 5));
  });

  it('findClosestCell_whenNothingAvailable_returnsNull', () => {
    expect(new BoardGeometry([11], DESIGN_RECT).findClosestCell({ x: 0, y: 0 }, () => false)).toBeNull();
  });
});
