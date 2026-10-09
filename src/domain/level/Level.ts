import type { BubbleColor } from '../board/BubbleColor';

const EMPTY_CELL = '.';
const COLOR_CODES: Readonly<Record<string, BubbleColor>> = { R: 'red', B: 'blue', G: 'green', Y: 'yellow' };

/** Starting board: one entry per cell, `null` for an empty cell. */
export type Level = { readonly rows: readonly (readonly (BubbleColor | null)[])[] };

/**
 * Parses rows of cell codes: `R`, `B`, `G`, `Y` (any case) or `.` for empty. A row one cell shorter than the widest
 * row is shifted by half a cell, which produces the honeycomb. Throws listing every unknown code.
 */
export function parseLevel(rows: readonly string[]): Level {
  const errors = rows.flatMap((row, rowIndex) =>
    [...row].flatMap((code, column) =>
      code === EMPTY_CELL || code.toUpperCase() in COLOR_CODES ? [] : [`unknown code '${code}' at row ${rowIndex}, column ${column}`],
    ),
  );
  if (errors.length > 0) {
    throw new Error(`Invalid level: ${errors.join('; ')}`);
  }

  return { rows: rows.map((row) => [...row].map((code) => COLOR_CODES[code.toUpperCase()] ?? null)) };
}

export function levelRowWidths(level: Level): number[] {
  return level.rows.map((row) => row.length);
}
