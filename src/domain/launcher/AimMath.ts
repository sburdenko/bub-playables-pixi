import { clamp, degreesToRadians } from '../../core/math/Scalar';
import { DOWN, length, rotate, scale, signedAngle, ZERO, type Vec2 } from '../../core/math/Vec2';

/** Limits a sling pull to a downward cone and a maximum length. Pulling upwards cancels the aim. */
export function clampPull(rawPull: Vec2, maxDistance: number, maxAngleDegrees: number): Vec2 {
  if (rawPull.y >= 0) {
    return ZERO;
  }

  const maxAngle = degreesToRadians(maxAngleDegrees);
  const angle = clamp(signedAngle(DOWN, rawPull), -maxAngle, maxAngle);

  return scale(rotate(DOWN, angle), Math.min(length(rawPull), maxDistance));
}
