import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { DOWN, length, normalize, signedAngle, UP, vec2, type Vec2 } from '../../../src/core/math/Vec2';
import { pingPongFrame, pingPongStepCount } from '../../../src/domain/animation/PingPong';
import { BoardGeometry } from '../../../src/domain/board/BoardGeometry';
import type { BubbleColor } from '../../../src/domain/board/BubbleColor';
import { cell, cellKey, type GridCell } from '../../../src/domain/board/GridCell';
import { computeRipple } from '../../../src/domain/board/ImpactRipple';
import { findMatch } from '../../../src/domain/board/MatchRule';
import { pickProjectileColor } from '../../../src/domain/board/ProjectileColorRule';
import { clampPull } from '../../../src/domain/launcher/AimMath';
import { levelRowWidths, parseLevel } from '../../../src/domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../../../src/domain/level/openingLevel';
import { isTouching } from '../../../src/domain/physics/ContactRule';
import { stepProjectile } from '../../../src/domain/physics/ProjectileMotion';
import { applyImpulse, isAtRest, SPRING_AT_REST, stepSpring, type SpringState } from '../../../src/domain/physics/SpringMotion';
import { travelDistance } from '../../../src/domain/physics/Travel';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);
const MAX_DISTANCE = 0.85;
const MAX_ANGLE = 40;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

function boardOf(rows: readonly string[]) {
  const level = parseLevel(rows);
  const colors = new Map<string, BubbleColor>();
  level.rows.forEach((row, rowIndex) => row.forEach((color, column) => color !== null && colors.set(cellKey(cell(rowIndex, column)), color)));

  return { geometry: new BoardGeometry(levelRowWidths(level), DESIGN_RECT), colorAt: (target: GridCell) => colors.get(cellKey(target)) };
}

describe('AimMath (ported from Unity)', () => {
  it('pullingUpwards_cancelsAim', () => {
    expect(clampPull(vec2(0.2, 0.5), MAX_DISTANCE, MAX_ANGLE)).toEqual({ x: 0, y: 0 });
  });

  it('shortStraightPull_isUnchanged', () => {
    const pull = clampPull(vec2(0, -0.5), MAX_DISTANCE, MAX_ANGLE);

    expect(pull.x).toBeCloseTo(0, 4);
    expect(pull.y).toBeCloseTo(-0.5, 4);
  });

  it('longPull_isClampedToMaxDistance', () => {
    expect(length(clampPull(vec2(0, -3), MAX_DISTANCE, MAX_ANGLE))).toBeCloseTo(MAX_DISTANCE, 4);
  });

  it('sidewaysPull_isClampedToMaxAngle', () => {
    const pull = clampPull(vec2(-0.6, -0.1), MAX_DISTANCE, MAX_ANGLE);

    expect(Math.abs(toDegrees(signedAngle(DOWN, pull)))).toBeCloseTo(MAX_ANGLE, 2);
  });
});

describe('Level', () => {
  it('parsesCodesInAnyCaseAndEmptyCells', () => {
    expect(parseLevel(['rB.', 'gY']).rows).toEqual([['red', 'blue', null], ['green', 'yellow']]);
  });

  it('reportsEveryUnknownCode', () => {
    expect(() => parseLevel(['RX', 'Q.'])).toThrow("unknown code 'X' at row 0, column 1; unknown code 'Q' at row 1, column 0");
  });

  it('openingLevel_isValidAndUsesTheHoneycomb', () => {
    const level = parseLevel(OPENING_LEVEL_ROWS);

    expect(level.rows).toHaveLength(13);
    expect(new Set(levelRowWidths(level))).toEqual(new Set([10, 11]));
  });
});

describe('MatchRule', () => {
  const { geometry, colorAt } = boardOf(['RRRRB', 'RBBB']);

  it('fiveConnectedOfOneColorMatch', () => {
    expect(findMatch(geometry, colorAt, cell(0, 0))).toHaveLength(5);
  });

  it('fourDoNot', () => {
    expect(findMatch(geometry, colorAt, cell(0, 4))).toBeNull();
  });

  it('emptyCellNeverMatches', () => {
    expect(findMatch(geometry, colorAt, cell(5, 0))).toBeNull();
  });
});

describe('ImpactRipple', () => {
  const { geometry, colorAt } = boardOf(['RRRRRRRRRRR', 'RRRRRRRRRR', 'RRRRRRRRRRR', 'RRRRRRRRRR', 'RRRRRRRRRRR']);
  const isOccupied = (target: GridCell) => colorAt(target) !== undefined;

  it('pushesEveryDirectNeighbourAwayFromTheSource', () => {
    const source = cell(4, 5);
    const impulses = computeRipple(geometry, isOccupied, source, UP);
    const direct = impulses.filter((impulse) => geometry.neighbors(source).some((neighbor) => cellKey(neighbor) === cellKey(impulse.cell)));

    expect(direct).toHaveLength(geometry.neighbors(source).filter(isOccupied).length);
    expect(direct.every((impulse) => impulse.strength > 0 && Math.abs(length(impulse.direction) - 1) < 1e-9)).toBe(true);
  });

  it('travelsOnlyWithinTheConeAndFadesWithDistance', () => {
    const impulses = computeRipple(geometry, isOccupied, cell(4, 5), UP);
    const far = impulses.filter((impulse) => impulse.cell.row <= 2);

    expect(far.length).toBeGreaterThan(0);
    expect(far.every((impulse) => toDegrees(Math.acos(impulse.direction.y)) <= 30 + 1e-6)).toBe(true);
    const strengths = impulses.map((impulse) => [4 - impulse.cell.row, impulse.strength] as const);
    const nearest = Math.max(...strengths.filter(([rows]) => rows <= 1).map(([, strength]) => strength));
    const farthest = Math.min(...strengths.filter(([rows]) => rows === 4).map(([, strength]) => strength));
    expect(farthest).toBeLessThan(nearest);
  });
});

describe('pickProjectileColor', () => {
  it('picksOnlyColoursStillOnTheBoard', () => {
    expect(pickProjectileColor(['blue', 'blue', 'green'], { next: () => 0.9 })).toBe('green');
    expect(pickProjectileColor(['blue', 'green'], { next: () => 0 })).toBe('blue');
  });

  it('emptyBoardFallsBackToRed', () => {
    expect(pickProjectileColor([], { next: () => 0.5 })).toBe('red');
  });
});

describe('stepProjectile', () => {
  const walls = { leftX: -3, rightX: 3 };

  it('movesAndAcceleratesAlongTheFlight', () => {
    const next = stepProjectile({ position: vec2(0, 0), velocity: vec2(0, 12) }, 0.1, 0.3, walls);

    expect(next.position.x).toBe(0);
    expect(next.position.y).toBeCloseTo(1.2, 10);
    expect(next.velocity.y).toBeCloseTo(12 + 14 * 0.1, 10);
  });

  it('bouncesOffBothWalls', () => {
    const left = stepProjectile({ position: vec2(-2.6, 0), velocity: vec2(-10, 5) }, 0.1, 0.3, walls);
    const right = stepProjectile({ position: vec2(2.6, 0), velocity: vec2(10, 5) }, 0.1, 0.3, walls);

    expect(left.position.x).toBeCloseTo(-2.7, 10);
    expect(left.velocity.x).toBeGreaterThan(0);
    expect(right.position.x).toBeCloseTo(2.7, 10);
    expect(right.velocity.x).toBeLessThan(0);
  });
});

describe('isTouching', () => {
  const projectile = (position: Vec2) => ({ position, radius: 0.3 });

  it('stopsAtTheCeiling', () => {
    expect(isTouching(projectile(vec2(0, 5.3)), 5, [])).toBe(true);
    expect(isTouching(projectile(vec2(0, 5.2)), 5, [])).toBe(false);
  });

  it('stopsWhenAlmostTouchingABubble', () => {
    const bubble = { position: vec2(0, 0), radius: 0.3 };

    expect(isTouching(projectile(vec2(0.56, 0)), 9, [bubble])).toBe(true);
    expect(isTouching(projectile(vec2(0.58, 0)), 9, [bubble])).toBe(false);
  });
});

describe('SpringMotion', () => {
  it('startsAtRestAndStaysThere', () => {
    expect(isAtRest(SPRING_AT_REST)).toBe(true);
    expect(stepSpring(SPRING_AT_REST, 0.016)).toBe(SPRING_AT_REST);
  });

  it('impulseMovesTheBubbleThenItSettles', () => {
    let state: SpringState = applyImpulse(SPRING_AT_REST, vec2(1, 0), 1);
    let maxOffset = 0;
    for (let frame = 0; frame < 120; frame++) {
      state = stepSpring(state, 1 / 60);
      maxOffset = Math.max(maxOffset, length(state.offset));
    }

    expect(maxOffset).toBeGreaterThan(0.01);
    expect(maxOffset).toBeLessThanOrEqual(1.04);
    expect(isAtRest(state)).toBe(true);
  });

  it('velocityIsCapped', () => {
    expect(length(applyImpulse(SPRING_AT_REST, normalize(vec2(1, 1)), 100).velocity)).toBeCloseTo(20.8, 10);
  });
});

describe('travel and ping-pong', () => {
  it('travelDistance_isAcceleratedAndScaled', () => {
    expect(travelDistance(12, 8, 0.5, 2)).toBeCloseTo((12 * 0.5 + 0.5 * 8 * 0.25) * 2, 10);
  });

  it('pingPong_playsForthAndBack', () => {
    expect(pingPongStepCount(5)).toBe(8);
    expect(Array.from({ length: 8 }, (_, step) => pingPongFrame(step, 5))).toEqual([0, 1, 2, 3, 4, 3, 2, 1]);
    expect(pingPongStepCount(1)).toBe(1);
    expect(pingPongFrame(0, 1)).toBe(0);
  });
});
