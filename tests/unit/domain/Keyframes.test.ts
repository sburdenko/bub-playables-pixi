import { describe, expect, it } from 'vitest';
import { evaluateCurve, keys } from '../../../src/domain/animation/Keyframes';

describe('evaluateCurve', () => {
  it('hitsKeysAndClampsOutsideTheCurve', () => {
    const curve = keys([0, 1], [0.5, 2], [1, 0]);

    expect(evaluateCurve(curve, -1)).toBe(1);
    expect(evaluateCurve(curve, 0.5)).toBeCloseTo(2, 10);
    expect(evaluateCurve(curve, 2)).toBe(0);
  });

  it('flatTangentsEaseInAndOut', () => {
    const curve = keys([0, 0], [1, 1]);

    expect(evaluateCurve(curve, 0.5)).toBeCloseTo(0.5, 10);
    expect(evaluateCurve(curve, 0.25)).toBeLessThan(0.25);
    expect(evaluateCurve(curve, 0.75)).toBeGreaterThan(0.75);
  });

  it('linearTangentsGiveAStraightLine', () => {
    const curve = keys([0, 0, 2], [1, 2, 2]);

    expect(evaluateCurve(curve, 0.3)).toBeCloseTo(0.6, 10);
  });

  it('steppedKeysHoldTheirValue', () => {
    const curve = keys([0, 5, 'stepped'], [1, 9]);

    expect(evaluateCurve(curve, 0.99)).toBe(5);
    expect(evaluateCurve(curve, 1)).toBe(9);
  });

  it('emptyCurveFailsLoudly', () => {
    expect(() => evaluateCurve([], 0)).toThrow(/at least one key/);
  });
});
