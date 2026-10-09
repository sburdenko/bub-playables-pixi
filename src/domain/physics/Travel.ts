/** Distance covered after `elapsed` seconds starting at `speed` with constant `acceleration`, in layout-scaled units. */
export function travelDistance(speed: number, acceleration: number, elapsed: number, layoutScale: number): number {
  return (speed * elapsed + 0.5 * acceleration * elapsed * elapsed) * layoutScale;
}
