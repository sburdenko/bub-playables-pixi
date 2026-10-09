import { describe, expect, it } from 'vitest';
import { evaluateBezier, progressAtDistance, sagControl } from '../../../src/core/math/QuadraticBezier';
import { centerX, centerY, rect, xMax, yMax } from '../../../src/core/math/Rect';
import { clamp01, degreesToRadians, lerp } from '../../../src/core/math/Scalar';
import { clampLength, DOWN, length, normalize, rotate, signedAngle, vec2, ZERO } from '../../../src/core/math/Vec2';

const START = vec2(0, 0);
const END = vec2(10, 0);
const STRAIGHT_CONTROL = vec2(5, 0);

describe('QuadraticBezier (ported from Unity)', () => {
  it('evaluate_hitsEndpoints', () => {
    const control = vec2(3, -4);

    expect(evaluateBezier(START, control, END, 0)).toEqual(START);
    expect(evaluateBezier(START, control, END, 1)).toEqual(END);
  });

  it('progressAtDistance_onStraightLine_isProportional', () => {
    expect(progressAtDistance(START, STRAIGHT_CONTROL, END, 2.5)).toBeCloseTo(0.25, 3);
    expect(progressAtDistance(START, STRAIGHT_CONTROL, END, 5)).toBeCloseTo(0.5, 3);
  });

  it('progressAtDistance_clampsToCurveEnds', () => {
    expect(progressAtDistance(START, STRAIGHT_CONTROL, END, -1)).toBe(0);
    expect(progressAtDistance(START, STRAIGHT_CONTROL, END, 100)).toBe(1);
  });

  it('progressAtDistance_onZeroLengthCurve_isComplete', () => {
    expect(progressAtDistance(START, START, START, 1)).toBe(1);
  });

  it('sagControl_dipsBelowLowerEnd', () => {
    const control = sagControl(vec2(0, 2), vec2(10, -1), 0.3, 1.5);

    expect(control.x).toBeCloseTo(3, 3);
    expect(control.y).toBeCloseTo(-2.5, 3);
  });
});

describe('Vec2', () => {
  it('normalize_keepsZeroAndMakesUnitLength', () => {
    expect(normalize(ZERO)).toEqual(ZERO);
    expect(length(normalize(vec2(3, 4)))).toBeCloseTo(1, 10);
  });

  it('rotate_isCounterClockwise', () => {
    const rotated = rotate(DOWN, Math.PI / 2);

    expect(rotated.x).toBeCloseTo(1, 10);
    expect(rotated.y).toBeCloseTo(0, 10);
  });

  it('signedAngle_isPositiveCounterClockwise', () => {
    expect(signedAngle(DOWN, vec2(1, 0))).toBeCloseTo(Math.PI / 2, 10);
    expect(signedAngle(DOWN, vec2(-1, 0))).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('clampLength_onlyShortensLongVectors', () => {
    expect(clampLength(vec2(0, 3), 1)).toEqual(vec2(0, 1));
    expect(clampLength(vec2(0, 0.5), 1)).toEqual(vec2(0, 0.5));
  });
});

describe('Rect and scalars', () => {
  it('rectEdgesAndCenter', () => {
    const area = rect(-1, -2, 4, 6);

    expect([xMax(area), yMax(area), centerX(area), centerY(area)]).toEqual([3, 4, 1, 1]);
  });

  it('scalarHelpers', () => {
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(-1)).toBe(0);
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
  });
});
