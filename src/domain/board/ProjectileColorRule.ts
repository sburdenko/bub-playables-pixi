import { randomPick, type IRandom } from '../../core/random/IRandom';
import type { BubbleColor } from './BubbleColor';

const FALLBACK_COLOR: BubbleColor = 'red';

/** The next shot is a random colour that is still on the board, so every shot can make a match. */
export function pickProjectileColor(colorsOnBoard: Iterable<BubbleColor>, random: IRandom): BubbleColor {
  return randomPick(random, [...new Set(colorsOnBoard)]) ?? FALLBACK_COLOR;
}
