import { describe, expect, it } from 'vitest';
import { vec2 } from '../../../src/core/math/Vec2';
import { TurnFlow } from '../../../src/game/flow/TurnFlow';
import type { IAttack } from '../../../src/game/ports/IAttack';
import type { IBubbleView } from '../../../src/game/ports/IBubbleView';
import type { ITurnBoard, Settlement } from '../../../src/game/ports/ITurnBoard';
import type { ITurnLauncher, Shot } from '../../../src/game/ports/ITurnLauncher';
import { FakeBubbleView, ScriptedPointer } from './fakes';

class FakeTurnBoard implements ITurnBoard {
  readonly layoutScale = 0.8;
  readonly launched: IBubbleView[] = [];
  settlement: Settlement | null = null;

  createProjectile(): IBubbleView {
    return new FakeBubbleView('red');
  }

  launch(bubble: IBubbleView): void {
    this.launched.push(bubble);
  }

  update(): Settlement | null {
    return this.settlement;
  }
}

class FakeTurnLauncher implements ITurnLauncher {
  isEmpty = true;
  pendingShot: Shot | null = null;

  load(): void {
    this.isEmpty = false;
  }

  update(): Shot | null {
    const shot = this.pendingShot;
    this.pendingShot = null;

    return shot;
  }
}

class CapturingAttack implements IAttack {
  scale: number | null = null;

  play(_matched: readonly IBubbleView[], layoutScale: number): void {
    this.scale = layoutScale;
  }

  update(): boolean {
    return false;
  }
}

function setUp() {
  const board = new FakeTurnBoard();
  const launcher = new FakeTurnLauncher();
  const attack = new CapturingAttack();
  const turn = new TurnFlow(board, launcher, attack, new ScriptedPointer([]), { next: () => 0 }, { isExpired: false }, 0.5);

  return { board, launcher, attack, turn };
}

describe('TurnFlow on its ports', () => {
  it('worksWithAnyBoardAndLauncherThatHonoursTheirInterfaces', () => {
    const { board, launcher, turn } = setUp();
    const bubble = new FakeBubbleView('red');

    turn.update(1 / 60);
    expect(launcher.isEmpty).toBe(false);

    launcher.pendingShot = { bubble, position: vec2(0, 0), velocity: vec2(0, 1) };
    turn.update(1 / 60);

    expect(board.launched).toEqual([bubble]);
    expect(turn.state.kind).toBe('projectileFlying');
  });

  it('handsTheMatchAndTheBoardScaleToTheAttack', () => {
    const { board, launcher, attack, turn } = setUp();
    launcher.pendingShot = { bubble: new FakeBubbleView('red'), position: vec2(0, 0), velocity: vec2(0, 1) };
    turn.update(1 / 60);
    turn.update(1 / 60);

    board.settlement = { landedAt: null, matched: [new FakeBubbleView('red')] };
    turn.update(1 / 60);

    expect(attack.scale).toBe(0.8);
    expect(turn.state.kind).toBe('resolvingAttack');
  });

  it('goesBackToWaitingWhenTheShotMatchesNothing', () => {
    const { board, launcher, turn } = setUp();
    launcher.pendingShot = { bubble: new FakeBubbleView('red'), position: vec2(0, 0), velocity: vec2(0, 1) };
    turn.update(1 / 60);
    turn.update(1 / 60);

    board.settlement = { landedAt: null, matched: [] };
    turn.update(1 / 60);

    expect(turn.state.kind).toBe('awaitingShot');
  });
});
