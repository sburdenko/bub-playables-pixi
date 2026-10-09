import type { IRandom } from '../../core/random/IRandom';
import type { BoardSystem } from '../board/BoardSystem';
import type { LauncherSystem } from '../launcher/LauncherSystem';
import type { IBubbleView } from '../ports/IBubbleView';
import type { IPointerSource } from '../ports/IPointerSource';

/** What happens to matched bubbles. The attack sequence takes ownership and reports when it is over. */
export interface IAttack {
  play(matched: readonly IBubbleView[], layoutScale: number): void;
  /** Advances the attack; returns true once it has finished. */
  update(deltaSeconds: number): boolean;
}

/** When the playable ends: after this many finished attacks, plus a pause to let the moment land. */
export type EndRule = { readonly afterAttacks: number; readonly delaySeconds: number };

export type TurnState =
  | { readonly kind: 'awaitingShot' }
  | { readonly kind: 'projectileFlying' }
  | { readonly kind: 'resolvingAttack' }
  | { readonly kind: 'ending'; readonly timer: number }
  | { readonly kind: 'ended' };

/** Runs a turn: load the sling, wait for the shot, fly it, resolve a match, repeat until the end rule. Systems never call each other. */
export class TurnFlow {
  private readonly _board: BoardSystem;
  private readonly _launcher: LauncherSystem;
  private readonly _attack: IAttack;
  private readonly _pointer: IPointerSource;
  private readonly _random: IRandom;
  private readonly _endRule: EndRule;
  private _state: TurnState = { kind: 'awaitingShot' };
  private _finishedAttacks = 0;

  constructor(board: BoardSystem, launcher: LauncherSystem, attack: IAttack, pointer: IPointerSource, random: IRandom, endRule: EndRule) {
    this._board = board;
    this._launcher = launcher;
    this._attack = attack;
    this._pointer = pointer;
    this._random = random;
    this._endRule = endRule;
  }

  get state(): TurnState {
    return this._state;
  }

  update(deltaSeconds: number): void {
    const pointer = this._pointer.poll();
    this._state = this.next(deltaSeconds, pointer);
  }

  private next(deltaSeconds: number, pointer: ReturnType<IPointerSource['poll']>): TurnState {
    switch (this._state.kind) {
      case 'awaitingShot': {
        if (this._launcher.isEmpty) {
          this._launcher.load(this._board.createProjectile(this._random));
        }

        const shot = this._launcher.update(pointer);
        if (shot === null) {
          return this._state;
        }

        this._board.launch(shot.bubble, shot.position, shot.velocity);

        return { kind: 'projectileFlying' };
      }
      case 'projectileFlying': {
        const settlement = this._board.update(deltaSeconds);
        if (settlement === null) {
          return this._state;
        }

        if (settlement.matched.length === 0) {
          return { kind: 'awaitingShot' };
        }

        this._attack.play(settlement.matched, this._board.geometry.scale);

        return { kind: 'resolvingAttack' };
      }
      case 'resolvingAttack':
        return this._attack.update(deltaSeconds) ? this.afterAttack() : this._state;
      case 'ending': {
        const timer = this._state.timer - deltaSeconds;

        return timer > 0 ? { kind: 'ending', timer } : { kind: 'ended' };
      }
      case 'ended':
        return this._state;
    }
  }

  private afterAttack(): TurnState {
    this._finishedAttacks++;

    return this._finishedAttacks >= this._endRule.afterAttacks ? { kind: 'ending', timer: this._endRule.delaySeconds } : { kind: 'awaitingShot' };
  }
}
