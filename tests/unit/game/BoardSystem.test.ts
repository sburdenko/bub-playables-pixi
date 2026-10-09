import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { cell } from '../../../src/domain/board/GridCell';
import { parseLevel } from '../../../src/domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../../../src/domain/level/openingLevel';
import { BoardSystem } from '../../../src/game/board/BoardSystem';
import { FakeFactory } from './fakes';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);
const TALL_DESIGN_RECT = rect(-3.79, -9, 7.58, 20);

describe('BoardSystem', () => {
  it('spawnsOneBubblePerFilledLevelCellOnItsGridPosition', () => {
    const factory = new FakeFactory();
    const board = new BoardSystem(parseLevel(['R.B', 'GY']), factory, DESIGN_RECT);

    expect(factory.created.map((view) => view.color)).toEqual(['red', 'blue', 'green', 'yellow']);
    expect(board.colorAt(cell(0, 2))).toBe('blue');
    expect(board.colorAt(cell(0, 1))).toBeUndefined();
    const blue = factory.created[1];
    expect(blue?.rest).toEqual(board.geometry.cellPosition(cell(0, 2)));
    expect(blue?.row).toBe(0);
    expect(blue?.layoutScale).toBe(board.geometry.scale);
  });

  it('openingLevel_hasEveryBubbleOfTheUnityLevel', () => {
    const factory = new FakeFactory();
    new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), factory, DESIGN_RECT);
    const filled = OPENING_LEVEL_ROWS.join('').replace(/\./g, '').length;

    expect(factory.created).toHaveLength(filled);
  });

  it('relayoutMovesBubblesToTheNewCellsWithoutRespawning', () => {
    const factory = new FakeFactory();
    const board = new BoardSystem(parseLevel(['RR']), factory, DESIGN_RECT);

    board.applyLayout(TALL_DESIGN_RECT);

    const [first] = factory.created;
    expect(first?.rest).toEqual(board.geometry.cellPosition(cell(0, 0)));
    expect(first?.spawnCount).toBe(1);
    expect(board.bubbles).toHaveLength(2);
  });
});
