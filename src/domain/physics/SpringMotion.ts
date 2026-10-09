import { add, clampLength, lengthSquared, normalize, scale, ZERO, type Vec2 } from '../../core/math/Vec2';

const SPRING = 192;
const DAMPING = 32;
const VELOCITY_GAIN = 14;
const MAX_OFFSET = 1.04;
const MAX_VELOCITY = MAX_OFFSET * 20;
const REST_THRESHOLD_SQUARED = 0.000001;

/** Wobble of a bubble around its rest position after a nearby impact. */
export type SpringState = { readonly offset: Vec2; readonly velocity: Vec2 };

export const SPRING_AT_REST: SpringState = { offset: ZERO, velocity: ZERO };

export function isAtRest(state: SpringState): boolean {
  return lengthSquared(state.offset) === 0 && lengthSquared(state.velocity) === 0;
}

export function applyImpulse(state: SpringState, direction: Vec2, strength: number): SpringState {
  const velocity = add(state.velocity, scale(normalize(direction), strength * VELOCITY_GAIN));

  return { offset: state.offset, velocity: clampLength(velocity, MAX_VELOCITY) };
}

/** Damped spring pulling the offset back to zero; snaps to rest once the motion is invisible. */
export function stepSpring(state: SpringState, deltaSeconds: number): SpringState {
  if (isAtRest(state)) {
    return state;
  }

  const pulled = add(state.velocity, scale(state.offset, -SPRING * deltaSeconds));
  const velocity = scale(pulled, Math.exp(-DAMPING * deltaSeconds));
  const offset = clampLength(add(state.offset, scale(velocity, deltaSeconds)), MAX_OFFSET);
  const isSettled = lengthSquared(offset) < REST_THRESHOLD_SQUARED && lengthSquared(velocity) < REST_THRESHOLD_SQUARED;

  return isSettled ? SPRING_AT_REST : { offset, velocity };
}
