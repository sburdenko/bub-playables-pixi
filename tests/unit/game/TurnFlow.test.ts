import { describe, expect, it } from 'vitest';
import { rect } from '../../../src/core/math/Rect';
import { cell } from '../../../src/domain/board/GridCell';
import { parseLevel } from '../../../src/domain/level/Level';
import { BoardSystem } from '../../../src/game/board/BoardSystem';
import { TurnFlow } from '../../../src/game/flow/TurnFlow';
import { LauncherSystem } from '../../../src/game/launcher/LauncherSystem';
import type { IAttack } from '../../../src/game/ports/IAttack';
import type { IBubbleView } from '../../../src/game/ports/IBubbleView';
import type { IRoundClock } from '../../../src/game/ports/IRoundClock';
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

class ManualClock implements IRoundClock {
  isExpired = false;
}

const END_DELAY_SECONDS = 0.5;

function setUp(level: string[], shotX: (board: BoardSystem) => number) {
  const clock = new ManualClock();
  const factory = new FakeFactory();
  const board = new BoardSystem(parseLevel(level), factory, DESIGN_RECT);
  const launcher = new LauncherSystem(new FakeSling());
  launcher.applyLayout(DESIGN_RECT, board.geometry.scale);
  const anchor = launcher.anchor;
  const pullX = anchor.x - (shotX(board) - anchor.x) * 0.05;
  const pointer = new ScriptedPointer([null, press(anchor.x, anchor.y), hold(pullX, anchor.y - 0.8), release(pullX, anchor.y - 0.8)]);
  const attack = new RecordingAttack();
  const turn = new TurnFlow(board, launcher, attack, pointer, { next: () => 0 }, clock, END_DELAY_SECONDS);

  return { board, launcher, turn, attack, factory, clock };
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

  it('keepsPlayingAfterAnAttackWhileTimeRemains', () => {
    const { turn } = setUp(['RRRR.RR'], (b) => b.geometry.cellPosition(cell(0, 4)).x);

    runUntil(turn, 'resolvingAttack');
    runUntil(turn, 'awaitingShot', 10);
    for (let frame = 0; frame < 120; frame++) {
      turn.update(1 / 60);
    }

    expect(turn.state.kind).toBe('awaitingShot');
  });

  it('endsAfterADelayOnceTheTimeIsUp', () => {
    const { turn, clock } = setUp(['RRRRRRRRRRR'], () => 0);

    turn.update(1 / 60);
    clock.isExpired = true;
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('ending');

    runUntil(turn, 'ended', 40);
    expect(turn.state.kind).toBe('ended');
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('ended');
  });

  it('letsTheRunningAttackFinishBeforeEnding', () => {
    const { turn, clock, attack } = setUp(['RRRR.RR'], (b) => b.geometry.cellPosition(cell(0, 4)).x);

    runUntil(turn, 'resolvingAttack');
    clock.isExpired = true;
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('resolvingAttack');

    attack.remainingFrames = 1;
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('awaitingShot');
    turn.update(1 / 60);
    expect(turn.state.kind).toBe('ending');
  });
});
