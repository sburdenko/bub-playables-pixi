export type GridCell = { readonly row: number; readonly column: number };

export function cell(row: number, column: number): GridCell {
  return { row, column };
}

/** Stable string key, for using cells in maps and sets. */
export function cellKey(target: GridCell): string {
  return `${target.row}:${target.column}`;
}

export function isSameCell(a: GridCell, b: GridCell): boolean {
  return a.row === b.row && a.column === b.column;
}
