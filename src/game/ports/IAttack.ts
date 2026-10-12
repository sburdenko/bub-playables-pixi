import type { IBubbleView } from './IBubbleView';

/** What happens to matched bubbles. The attack sequence takes ownership and reports when it is over. */
export interface IAttack {
  play(matched: readonly IBubbleView[], layoutScale: number): void;
  /** Advances the attack; returns true once it has finished. */
  update(deltaSeconds: number): boolean;
}
