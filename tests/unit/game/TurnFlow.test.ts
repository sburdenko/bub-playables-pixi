import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { cell } from '../../../src/domain/board/GridCell';
import { parseLevel } from '../../../src/domain/level/Level';
import { BoardSystem } from '../../../src/game/board/BoardSystem';
import { TurnFlow, type IAttack } from '../../../src/game/flow/TurnFlow';
import { LauncherSystem } from '../../../src/game/launcher/LauncherSystem';
import type { IBubbleView } from '../../../src/game/ports/IBubbleView';
import { FakeFactory, FakeSling, hold, press, release, ScriptedPointer } from './fakes';

const DESIGN_RECT = rect(-3.79, -7.2, 7.58, 16.4);

class RecordingAttack implements IAttack {
  played: (readonly IBubbleView[])[] = [];
  remainingFrames = 3;

  play(matched: readonly IBubbleView[]): void {
    this.played.push(matched);
  }

  update(): boolean {
    this.remainingFrames--;

    return this.remainingFrames <= 0;
  }
}

function setUp(level: string[], shotX: (board: BoardSystem) => number, endRule = { afterAttacks: 2, delaySeconds: 0.5 }) {
  const factory = new FakeFactory();
  const board = new BoardSystem(parseLevel(level), factory, DESIGN_RECT);
  const launcher = new LauncherSystem(new FakeSling());
  launcher.applyLayout(DESIGN_RECT, board.geometry.scale);
  const anchor = launcher.anchor;
  const pullX = anchor.x - (shotX(board) - anchor.x) * 0.05;
  const pointer = new ScriptedPointer([null, press(anchor.x, anchor.y), hold(pullX, anchor.y - 0.8), release(pullX, anchor.y - 0.8)]);
  const attack = new RecordingAttack();
  const turn = new TurnFlow(board, launcher, attack, pointer, { next: () => 0 }, endRule);

  return { board, launcher, turn, attack, factory };
}

function runUntil(turn: TurnFlow, kind: string, maxFrames = 600): void {
  for (let frame = 0; frame < maxFrames && turn.state.kind !== kind; frame++) {
    turn.update(1 / 60);
  }
}

describe('TurnFlow', () => {
  it('loadsTheSlingThenShootsAndWaitsForTheNextShot', () => {
    const { turn, launcher } = setUp(['RRRRRRRRRRR'], () => 0);

    turn.update(1 / 60);
    expect(launcher.isEmpty).toBe(false);
    expect(turn.state.kind).toBe('awaitingShot');

    runUntil(turn, 'projectileFlying', 10);
    expect(turn.state.kind).toBe('projectileFlying');

    runUntil(turn, 'awaitingShot');
    expect(turn.state.kind).toBe('awaitingShot');
  });

  it('matchHandsTheBubblesToTheAttackAndResumesWhenItEnds', () => {
    const { turn, attack, board } = setUp(['RRRR.RR'], (b) => b.geometry.cellPosition(cell(0, 4)).x);

    runUntil(turn, 'resolvingAttack');
    expect(attack.played[0]).toHaveLength(7);
    expect(board.bubbles).toHaveLength(0);

    runUntil(turn, 'awaitingShot', 10);
    expect(turn.state.kind).toBe('awaitingShot');
  });

  it('endsAfterTheConfiguredAttacksAndADelay', () => {
    const { turn } = setUp(['RRRR.RR'], (b) => b.geometry.cellPosition(cell(0, 4)).x, { afterAttacks: 1, delaySeconds: 0.5 });

    runUntil(turn, 'ending');
    expect(turn.state.kind).toBe('ending');

    runUntil(turn, 'ended', 40);
    expect(turn.state.kind).toBe('ended');
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('ended');
  });
});
