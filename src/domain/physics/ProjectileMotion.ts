import { add, normalize, scale, vec2, type Vec2 } from '../../core/math/Vec2';

const PROJECTILE_ACCELERATION = 14;

export type ProjectileState = { readonly position: Vec2; readonly velocity: Vec2 };

export type Walls = { readonly leftX: number; readonly rightX: number };

/** One frame of flight: move, speed up along the flight direction, bounce off the side walls. */
export function stepProjectile(state: ProjectileState, deltaSeconds: number, radius: number, walls: Walls): ProjectileState {
  const moved = add(state.position, scale(state.velocity, deltaSeconds));
  const accelerated = add(state.velocity, scale(normalize(state.velocity), PROJECTILE_ACCELERATION * deltaSeconds));

  if (moved.x < walls.leftX + radius) {
    return { position: vec2(walls.leftX + radius, moved.y), velocity: vec2(-accelerated.x, accelerated.y) };
  }

  if (moved.x > walls.rightX - radius) {
    return { position: vec2(walls.rightX - radius, moved.y), velocity: vec2(-accelerated.x, accelerated.y) };
  }

  return { position: moved, velocity: accelerated };
}
