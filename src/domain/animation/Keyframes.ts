/** Infinite Unity tangent: the value holds until the next key. */
export type Slope = number | 'stepped';

export type Keyframe = { readonly time: number; readonly value: number; readonly inSlope: Slope; readonly outSlope: Slope };

/**
 * Value of a keyframed curve at `time`, interpolated like Unity: cubic Hermite between keys using their tangents,
 * a held value across stepped keys, and clamped to the first and last keys outside the curve.
 */
export function evaluateCurve(keys: readonly Keyframe[], time: number): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error('A curve needs at least one key.');
  }

  if (time <= first.time) {
    return first.value;
  }

  if (time >= last.time) {
    return last.value;
  }

  const index = keys.findIndex((key) => key.time > time);
  const start = keys[index - 1] ?? first;
  const end = keys[index] ?? last;

  return interpolate(start, end, time);
}

function interpolate(start: Keyframe, end: Keyframe, time: number): number {
  if (start.outSlope === 'stepped' || end.inSlope === 'stepped') {
    return start.value;
  }

  const span = end.time - start.time;
  const t = (time - start.time) / span;
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    (2 * t3 - 3 * t2 + 1) * start.value +
    (t3 - 2 * t2 + t) * start.outSlope * span +
    (-2 * t3 + 3 * t2) * end.value +
    (t3 - t2) * end.inSlope * span
  );
}

/** Shorthand for authoring clip data: `[time, value, inSlope?, outSlope?]`. */
export function keys(...entries: readonly (readonly [number, number, Slope?, Slope?])[]): Keyframe[] {
  return entries.map(([time, value, inSlope = 0, outSlope = inSlope]) => ({ time, value, inSlope, outSlope }));
}
