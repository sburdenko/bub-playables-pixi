import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import type { Vec2 } from '../../../src/core/math/Vec2';
import type { BubbleColor } from '../../../src/domain/board/BubbleColor';
import { cell } from '../../../src/domain/board/GridCell';
import { parseLevel } from '../../../src/domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../../../src/domain/level/openingLevel';
import { BoardSystem } from '../../../src/game/board/BoardSystem';
import type { IBubbleView, IBubbleViewFactory } from '../../../src/game/ports/IBubbleView';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);
const TALL_DESIGN_RECT = rect(-3.79, -9, 7.58, 20);

class FakeBubbleView implements IBubbleView {
  readonly color: BubbleColor;
  layoutScale = 0;
  rest: Vec2 | null = null;
  row: number | null = null;
  spawnCount = 0;
  impacts: { direction: Vec2; strength: number }[] = [];
  isDestroyed = false;

  constructor(color: BubbleColor) {
    this.color = color;
  }

  get radius(): number {
    return 0.35 * this.layoutScale;
  }

  setLayoutScale(scale: number): void {
    this.layoutScale = scale;
  }

  place(rest: Vec2, row: number): void {
    this.rest = rest;
    this.row = row;
    this.spawnCount++;
  }

  setRestPosition(rest: Vec2): void {
    this.rest = rest;
  }

  applyImpact(direction: Vec2, strength: number): void {
    this.impacts.push({ direction, strength });
  }

  destroy(): void {
    this.isDestroyed = true;
  }
}

class FakeFactory implements IBubbleViewFactory {
  readonly created: FakeBubbleView[] = [];

  create(color: BubbleColor): FakeBubbleView {
    const view = new FakeBubbleView(color);
    this.created.push(view);

    return view;
  }
}

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
