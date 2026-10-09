import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { vec2 } from '../../../src/core/math/Vec2';
import { cell } from '../../../src/domain/board/GridCell';
import { parseLevel } from '../../../src/domain/level/Level';
import { BoardSystem, type Settlement } from '../../../src/game/board/BoardSystem';
import { FakeBubbleView, FakeFactory } from './fakes';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);

function fly(board: BoardSystem, bubble: FakeBubbleView, from: { x: number; y: number }, velocity: { x: number; y: number }): Settlement {
  bubble.setLayoutScale(board.geometry.scale);
  board.launch(bubble, vec2(from.x, from.y), vec2(velocity.x, velocity.y));
  for (let frame = 0; frame < 600; frame++) {
    const settlement = board.update(1 / 60);
    if (settlement !== null) {
      return settlement;
    }
  }

  throw new Error('The shot never landed.');
}

describe('BoardSystem flight', () => {
  it('shotLandsOnTheNearestFreeCellAndJoinsTheBoard', () => {
    const board = new BoardSystem(parseLevel(['RRRRRRRRRRR']), new FakeFactory(), DESIGN_RECT);
    const shot = new FakeBubbleView('blue');
    const x = board.geometry.cellPosition(cell(0, 5)).x;

    const settlement = fly(board, shot, { x, y: -3 }, { x: 0, y: 12 });

    expect(shot.isLaunched).toBe(true);
    expect(settlement).toEqual({ landedAt: cell(1, 5), matched: [] });
    expect(board.colorAt(cell(1, 5))).toBe('blue');
    expect(shot.rest).toEqual(board.geometry.cellPosition(cell(1, 5)));
  });

  it('landingPushesTheNeighbours', () => {
    const factory = new FakeFactory();
    const board = new BoardSystem(parseLevel(['RRRRRRRRRRR']), factory, DESIGN_RECT);
    const x = board.geometry.cellPosition(cell(0, 5)).x;

    fly(board, new FakeBubbleView('blue'), { x, y: -3 }, { x: 0, y: 12 });

    const pushed = factory.created.filter((view) => view.impacts.length > 0);
    expect(pushed.length).toBeGreaterThan(0);
  });

  it('fiveOfAColourMatchAndLeaveTheBoard', () => {
    const factory = new FakeFactory();
    const board = new BoardSystem(parseLevel(['RRRR.BBBBBB']), factory, DESIGN_RECT);
    const x = board.geometry.cellPosition(cell(0, 4)).x;

    const settlement = fly(board, new FakeBubbleView('red'), { x, y: -3 }, { x: 0, y: 12 });

    expect(settlement.landedAt).toEqual(cell(0, 4));
    expect(settlement.matched).toHaveLength(5);
    expect(board.colorAt(cell(0, 0))).toBeUndefined();
    expect(board.bubbles).toHaveLength(6);
  });

  it('shotsBounceOffTheSideWalls', () => {
    const board = new BoardSystem(parseLevel(['...........']), new FakeFactory(), DESIGN_RECT);

    const settlement = fly(board, new FakeBubbleView('red'), { x: 0, y: -3 }, { x: 9, y: 6 });

    expect(settlement.landedAt?.row).toBe(0);
  });

  it('aSlowFrameRateDoesNotLetTheShotPassThroughBubbles', () => {
    const board = new BoardSystem(parseLevel(['RRRRRRRRRRR', 'RRRRRRRRRR']), new FakeFactory(), DESIGN_RECT);
    const shot = new FakeBubbleView('blue');
    shot.setLayoutScale(board.geometry.scale);
    const x = board.geometry.cellPosition(cell(1, 5)).x;
    board.launch(shot, vec2(x, -3), vec2(0, 25));

    let settlement = board.update(0.1);
    for (let frame = 0; frame < 50 && settlement === null; frame++) {
      settlement = board.update(0.1);
    }

    expect(settlement?.landedAt?.row).toBe(2);
  });

  it('projectileColourComesFromTheBoard', () => {
    const board = new BoardSystem(parseLevel(['GGG']), new FakeFactory(), DESIGN_RECT);

    expect(board.createProjectile({ next: () => 0.7 }).color).toBe('green');
  });

  it('idleBoardHasNothingToSettle', () => {
    const board = new BoardSystem(parseLevel(['R']), new FakeFactory(), DESIGN_RECT);

    expect(board.update(1 / 60)).toBeNull();
  });
});
