import { describe, expect, it } from 'vitest';
import { vec2, type Vec2 } from '../../../src/core/math/Vec2';
import { MatchAttackSequence, ORB_GATHER_POSITION } from '../../../src/game/attack/MatchAttackSequence';
import type { BurstKind, IEffects, IOrbView, ITarget, TextKind } from '../../../src/game/ports/IAttackViews';
import { FakeBubbleView } from './fakes';

class FakeOrb implements IOrbView {
  isVisible = false;
  position: Vec2 = vec2(0, 0);
  scale = 0;

  show(position: Vec2): void {
    this.isVisible = true;
    this.position = position;
  }

  moveTo(position: Vec2): void {
    this.position = position;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  hide(): void {
    this.isVisible = false;
  }
}

class FakeEnemy implements ITarget {
  readonly position = vec2(2.5, -6);
  hits = 0;

  playHit(): void {
    this.hits++;
  }
}

class FakeEffects implements IEffects {
  bursts: BurstKind[] = [];
  texts: { kind: TextKind; value: number }[] = [];

  spawnBurst(kind: BurstKind): void {
    this.bursts.push(kind);
  }

  spawnText(kind: TextKind, _position: Vec2, value: number): void {
    this.texts.push({ kind, value });
  }
}

function setUp(count: number) {
  const orb = new FakeOrb();
  const enemy = new FakeEnemy();
  const effects = new FakeEffects();
  const attack = new MatchAttackSequence(orb, enemy, effects);
  const bubbles = Array.from({ length: count }, (_, index) => {
    const bubble = new FakeBubbleView('green');
    bubble.setLayoutScale(1);
    bubble.place(vec2(index * 0.7 - 1.5, 4), 3);

    return bubble;
  });
  attack.play(bubbles, 1);

  return { orb, enemy, effects, attack, bubbles };
}

function run(attack: MatchAttackSequence, seconds: number): boolean {
  let isDone = false;
  for (let elapsed = 0; elapsed < seconds && !isDone; elapsed += 1 / 60) {
    isDone = attack.update(1 / 60);
  }

  return isDone;
}

describe('MatchAttackSequence', () => {
  it('startsWithAScorePerBubbleAndAnEmptyOrb', () => {
    const { orb, effects } = setUp(5);

    expect(effects.texts).toEqual(Array.from({ length: 5 }, () => ({ kind: 'score', value: 5 })));
    expect(orb.isVisible).toBe(true);
    expect(orb.position).toEqual(ORB_GATHER_POSITION);
    expect(orb.scale).toBeCloseTo(0.1, 10);
  });

  it('popsBubblesInAStaggerThenFliesThemIntoTheOrb', () => {
    const { attack, bubbles } = setUp(5);

    run(attack, 0.06);
    expect(bubbles.map((bubble) => bubble.events.includes('match'))).toEqual([true, true, false, false, false]);

    run(attack, 0.6);
    expect(bubbles[0]?.events).toContain('collect');
    expect(bubbles[0]?.rotation).toBeLessThan(0);
  });

  it('chargesTheOrbHitsTheEnemyAndDestroysEveryBubble', () => {
    const { attack, bubbles, orb, enemy, effects } = setUp(6);

    expect(run(attack, 10)).toBe(true);

    expect(bubbles.every((bubble) => bubble.isDestroyed)).toBe(true);
    expect(orb.scale).toBeCloseTo(2.3, 10);
    expect(orb.isVisible).toBe(false);
    expect(orb.position).toEqual(enemy.position);
    expect(enemy.hits).toBe(1);
    expect(effects.texts.at(-1)).toEqual({ kind: 'damage', value: 30 });
    expect(effects.bursts.filter((kind) => kind === 'trailingImpact')).toHaveLength(7);
    expect(effects.bursts).toEqual(expect.arrayContaining(['enemyImpact', 'energyBurst']));
  });

  it('anEmptyMatchHasNothingToPlay', () => {
    const orb = new FakeOrb();
    const attack = new MatchAttackSequence(orb, new FakeEnemy(), new FakeEffects());

    attack.play([], 1);

    expect(orb.isVisible).toBe(false);
    expect(attack.update(1 / 60)).toBe(true);
  });

  it('isFinishedWhenIdle', () => {
    const attack = new MatchAttackSequence(new FakeOrb(), new FakeEnemy(), new FakeEffects());

    expect(attack.update(1 / 60)).toBe(true);
  });
});
