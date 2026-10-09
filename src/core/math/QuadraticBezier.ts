import { distance, lerp2, vec2, type Vec2 } from './Vec2';

const LENGTH_SAMPLE_COUNT = 24;

export function evaluateBezier(start: Vec2, control: Vec2, end: Vec2, t: number): Vec2 {
  return lerp2(lerp2(start, control, t), lerp2(control, end, t), t);
}

/**
 * Curve parameter reached after travelling `travelled` along the curve, so motion driven by distance keeps a
 * constant speed however the control point bends the curve.
 */
export function progressAtDistance(start: Vec2, control: Vec2, end: Vec2, travelled: number): number {
  if (travelled <= 0) {
    return 0;
  }

  let covered = 0;
  let previous = start;
  for (let sample = 1; sample <= LENGTH_SAMPLE_COUNT; sample++) {
    const t = sample / LENGTH_SAMPLE_COUNT;
    const point = evaluateBezier(start, control, end, t);
    const segment = distance(previous, point);
    if (covered + segment >= travelled) {
      const previousT = (sample - 1) / LENGTH_SAMPLE_COUNT;

      return previousT + (t - previousT) * ((travelled - covered) / segment);
    }

    covered += segment;
    previous = point;
  }

  return 1;
}

/**
 * Control point that makes the curve dip `sag` below the lower end, with the dip biased towards `apexPosition`
 * (0 = start, 1 = end).
 */
export function sagControl(start: Vec2, end: Vec2, apexPosition: number, sag: number): Vec2 {
  return vec2(lerp2(start, end, apexPosition).x, Math.min(start.y, end.y) - sag);
}
