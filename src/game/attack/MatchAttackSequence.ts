import { evaluateBezier, progressAtDistance, sagControl } from '../../core/math/QuadraticBezier';
import { degreesToRadians, lerp } from '../../core/math/Scalar';
import { add, distance, vec2, type Vec2 } from '../../core/math/Vec2';
import { BUBBLE_BASE_RADIUS } from '../../domain/board/BoardGeometry';
import { travelDistance } from '../../domain/physics/Travel';
import type { IAttack } from '../flow/TurnFlow';
import type { IEffects, IOrbView, ITarget } from '../ports/IAttackViews';
import type { IBubbleView } from '../ports/IBubbleView';

const SCORE_PER_BUBBLE = 5;
const BUBBLE_START_STAGGER = 0.05;
const MATCH_ANIMATION_DURATION = 0.41666666;
const SHRINK_DURATION = 0.1;
const BUBBLE_FLIGHT = { speed: 12, acceleration: 8, apex: 0.35, sag: 1.26 };
const BUBBLE_SPIN_RADIANS_PER_SECOND = -degreesToRadians(720);
const BUBBLE_ARRIVAL_RADIUS_FACTOR = 0.5;
const ORB_SCALE = { min: 0.1, max: 2.3 };
const ORB_FLIGHT = { speed: 15, acceleration: 10, apex: 0.3, sag: 1.12 };
const ORB_HIT_DISTANCE = 0.35;
const DAMAGE_TEXT_OFFSET_Y = 0.9;
const HIT_BURST_SCALE = 0.9;
export const ORB_GATHER_POSITION = vec2(0, -1);

type Stage =
  | { readonly kind: 'waiting'; readonly startTime: number }
  | { readonly kind: 'popping'; readonly startTime: number }
  | { readonly kind: 'flying'; readonly startTime: number; readonly start: Vec2; readonly control: Vec2 }
  | { readonly kind: 'shrinking'; readonly startTime: number }
  | { readonly kind: 'done' };

type Collected = { readonly bubble: IBubbleView; readonly stage: Stage };

type Phase = { readonly kind: 'idle' } | { readonly kind: 'gathering' } | { readonly kind: 'orbFlying'; readonly launchTime: number } | { readonly kind: 'orbHit' };

/**
 * The reward for a match: every matched bubble pops (staggered), arcs into the orb and charges it; the fully charged
 * orb then arcs into the enemy. Owns the matched bubbles until they are destroyed.
 */
export class MatchAttackSequence implements IAttack {
  private readonly _orb: IOrbView;
  private readonly _enemy: ITarget;
  private readonly _effects: IEffects;
  private _phase: Phase = { kind: 'idle' };
  private _collected: readonly Collected[] = [];
  private _time = 0;
  private _layoutScale = 1;
  private _arrived = 0;

  constructor(orb: IOrbView, enemy: ITarget, effects: IEffects) {
    this._orb = orb;
    this._enemy = enemy;
    this._effects = effects;
  }

  /** Takes ownership of `matched`; an empty match has nothing to play and finishes at once. */
  play(matched: readonly IBubbleView[], layoutScale: number): void {
    if (matched.length === 0) {
      return;
    }

    this._phase = { kind: 'gathering' };
    this._time = 0;
    this._arrived = 0;
    this._layoutScale = layoutScale;
    this._orb.show(ORB_GATHER_POSITION);
    this.setOrbCharge(0);
    this._collected = matched.map((bubble, index) => {
      this._effects.spawnText('score', bubble.position, SCORE_PER_BUBBLE, layoutScale);

      return { bubble, stage: { kind: 'waiting', startTime: index * BUBBLE_START_STAGGER } };
    });
  }

  update(deltaSeconds: number): boolean {
    if (this._phase.kind === 'idle') {
      return true;
    }

    this._time += deltaSeconds;
    this._collected = this._collected.map((entry) => ({ bubble: entry.bubble, stage: this.advance(entry, deltaSeconds) }));
    if (this._phase.kind === 'orbFlying') {
      this.flyOrb(this._phase.launchTime);
    }

    if (this._phase.kind === 'orbHit' && this._collected.every((entry) => entry.stage.kind === 'done')) {
      this._phase = { kind: 'idle' };
      this._collected = [];
    }

    return this._phase.kind === 'idle';
  }

  private advance({ bubble, stage }: Collected, deltaSeconds: number): Stage {
    switch (stage.kind) {
      case 'waiting':
        if (this._time < stage.startTime) {
          return stage;
        }

        bubble.playMatch();

        return { kind: 'popping', startTime: stage.startTime };
      case 'popping':
        return this._time >= stage.startTime + MATCH_ANIMATION_DURATION ? this.startFlight(bubble) : stage;
      case 'flying':
        return this.fly(bubble, stage, deltaSeconds);
      case 'shrinking':
        return this.shrink(bubble, stage);
      case 'done':
        return stage;
    }
  }

  private startFlight(bubble: IBubbleView): Stage {
    const start = bubble.position;
    const control = sagControl(start, ORB_GATHER_POSITION, BUBBLE_FLIGHT.apex, BUBBLE_FLIGHT.sag * this._layoutScale);
    bubble.beginCollect();

    return { kind: 'flying', startTime: this._time, start, control };
  }

  private fly(bubble: IBubbleView, stage: Extract<Stage, { kind: 'flying' }>, deltaSeconds: number): Stage {
    const travelled = travelDistance(BUBBLE_FLIGHT.speed, BUBBLE_FLIGHT.acceleration, this._time - stage.startTime, this._layoutScale);
    const progress = progressAtDistance(stage.start, stage.control, ORB_GATHER_POSITION, travelled);
    const position = evaluateBezier(stage.start, stage.control, ORB_GATHER_POSITION, progress);
    bubble.setPosition(position);
    bubble.rotateBy(BUBBLE_SPIN_RADIANS_PER_SECOND * deltaSeconds);
    if (progress < 1 && distance(position, ORB_GATHER_POSITION) > BUBBLE_BASE_RADIUS * this._layoutScale * BUBBLE_ARRIVAL_RADIUS_FACTOR) {
      return stage;
    }

    bubble.setPosition(ORB_GATHER_POSITION);
    bubble.stopAnimation();
    this._effects.spawnBurst('trailingImpact', ORB_GATHER_POSITION, this._layoutScale);
    this._arrived++;
    this.setOrbCharge(this._arrived / this._collected.length);
    if (this._arrived === this._collected.length) {
      this._phase = { kind: 'orbFlying', launchTime: this._time };
    }

    return { kind: 'shrinking', startTime: this._time };
  }

  private shrink(bubble: IBubbleView, stage: Extract<Stage, { kind: 'shrinking' }>): Stage {
    const progress = (this._time - stage.startTime) / SHRINK_DURATION;
    if (progress >= 1) {
      bubble.destroy();

      return { kind: 'done' };
    }

    bubble.setShrink(1 - progress);

    return stage;
  }

  private flyOrb(launchTime: number): void {
    const target = this._enemy.position;
    const control = sagControl(ORB_GATHER_POSITION, target, ORB_FLIGHT.apex, ORB_FLIGHT.sag * this._layoutScale);
    const travelled = travelDistance(ORB_FLIGHT.speed, ORB_FLIGHT.acceleration, this._time - launchTime, this._layoutScale);
    const progress = progressAtDistance(ORB_GATHER_POSITION, control, target, travelled);
    const position = evaluateBezier(ORB_GATHER_POSITION, control, target, progress);
    this._orb.moveTo(position);
    this._collected.filter((entry) => entry.stage.kind === 'shrinking').forEach((entry) => entry.bubble.setPosition(position));
    if (progress < 1 && distance(position, target) > ORB_HIT_DISTANCE * this._layoutScale) {
      return;
    }

    this._orb.moveTo(target);
    this._orb.hide();
    this._phase = { kind: 'orbHit' };
    this.hitEnemy(target);
  }

  private hitEnemy(target: Vec2): void {
    this._enemy.playHit();
    this._effects.spawnText('damage', add(target, vec2(0, DAMAGE_TEXT_OFFSET_Y * this._layoutScale)), this._collected.length * SCORE_PER_BUBBLE, this._layoutScale);
    this._effects.spawnBurst('enemyImpact', target, this._layoutScale);
    this._effects.spawnBurst('trailingImpact', target, this._layoutScale);
    this._effects.spawnBurst('energyBurst', target, this._layoutScale * HIT_BURST_SCALE);
  }

  private setOrbCharge(charge: number): void {
    this._orb.setScale(lerp(ORB_SCALE.min, ORB_SCALE.max, charge) * this._layoutScale);
  }
}
