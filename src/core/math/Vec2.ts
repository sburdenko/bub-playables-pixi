/** Immutable 2D vector in world units (Y up). Every operation returns a new vector. */
export type Vec2 = { readonly x: number; readonly y: number };

export const ZERO: Vec2 = { x: 0, y: 0 };
export const DOWN: Vec2 = { x: 0, y: -1 };
export const UP: Vec2 = { x: 0, y: 1 };

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, factor: number): Vec2 {
  return { x: v.x * factor, y: v.y * factor };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSquared(v: Vec2): number {
  return dot(v, v);
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSquared(v));
}

export function distance(a: Vec2, b: Vec2): number {
  return length(subtract(a, b));
}

/** Unit vector in the same direction; the zero vector stays zero. */
export function normalize(v: Vec2): Vec2 {
  const size = length(v);

  return size === 0 ? ZERO : scale(v, 1 / size);
}

/** Rotates counter-clockwise by `radians`. */
export function rotate(v: Vec2, radians: number): Vec2 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

export function clampLength(v: Vec2, maxLength: number): Vec2 {
  const size = length(v);

  return size > maxLength ? scale(v, maxLength / size) : v;
}

export function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Signed angle in radians from `from` to `to`, counter-clockwise positive. */
export function signedAngle(from: Vec2, to: Vec2): number {
  return Math.atan2(from.x * to.y - from.y * to.x, dot(from, to));
}
