import { distance, type Vec2 } from '../../core/math/Vec2';

const CONTACT_DISTANCE_FACTOR = 0.95;

export type Body = { readonly position: Vec2; readonly radius: number };

/** A flying bubble stops when it reaches the ceiling or (almost) touches any bubble on the board. */
export function isTouching(projectile: Body, ceilingY: number, bubbles: Iterable<Body>): boolean {
  if (projectile.position.y >= ceilingY + projectile.radius) {
    return true;
  }

  for (const bubble of bubbles) {
    if (distance(projectile.position, bubble.position) <= (projectile.radius + bubble.radius) * CONTACT_DISTANCE_FACTOR) {
      return true;
    }
  }

  return false;
}
