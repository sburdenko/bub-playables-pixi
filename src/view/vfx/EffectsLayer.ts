import type { Container } from 'pixi.js';
import { distance, type Vec2 } from '../../core/math/Vec2';
import type { IRandom } from '../../core/random/IRandom';
import type { EmitterConfig } from '../../domain/vfx/Particles';
import type { BurstKind, IEffects, TextKind } from '../../game/ports/IAttackViews';
import type { ITextureSource } from '../assets/ITextureSource';
import { ENEMY_IMPACT, ENERGY_BURST, MATCH_GLOW, TRAIL_RATE_PER_UNIT, TRAIL_SCALE, TRAIL_TWINKLE, TRAILING_IMPACT } from './effectConfigs';
import { FloatingText } from './FloatingText';
import { ParticleBatch } from './ParticleBatch';

const BURSTS: Readonly<Record<BurstKind, readonly EmitterConfig[]>> = {
  trailingImpact: TRAILING_IMPACT,
  enemyImpact: ENEMY_IMPACT,
  energyBurst: ENERGY_BURST,
};

/** Sparkles that follow a moving bubble, emitted per distance travelled. */
export interface ITrail {
  follow(position: Vec2, layoutScale: number): void;
  stop(): void;
}

/** One-shot particle bursts, floating numbers and bubble trails, all advanced every frame. */
export class EffectsLayer implements IEffects {
  private readonly _textures: ITextureSource;
  private readonly _world: Container;
  private readonly _random: IRandom;
  private _batches: readonly ParticleBatch[] = [];
  private _texts: readonly FloatingText[] = [];

  constructor(textures: ITextureSource, world: Container, random: IRandom) {
    this._textures = textures;
    this._world = world;
    this._random = random;
  }

  spawnBurst(kind: BurstKind, position: Vec2, effectScale: number): void {
    this.burst(BURSTS[kind], position, effectScale);
  }

  spawnText(kind: TextKind, position: Vec2, value: number, layoutScale: number): void {
    const text = new FloatingText(kind, position, value, layoutScale);
    this._world.addChild(text);
    this._texts = [...this._texts, text];
  }

  spawnMatchGlow(position: Vec2, layoutScale: number): void {
    this.burst(MATCH_GLOW, position, layoutScale);
  }

  createTrail(): ITrail {
    let origin: Vec2 | null = null;
    let batch: ParticleBatch | null = null;
    let carried = 0;

    return {
      follow: (position, layoutScale) => {
        batch ??= this.addBatch(TRAIL_TWINKLE, layoutScale * TRAIL_SCALE, () => origin ?? position, true);
        carried += origin === null ? 0 : distance(origin, position) * TRAIL_RATE_PER_UNIT;
        origin = position;
        for (; carried >= 1; carried--) {
          batch.burst(this._random);
        }
      },
      stop: () => {
        batch?.release();
        batch = null;
        origin = null;
        carried = 0;
      },
    };
  }

  update(deltaSeconds: number): void {
    this._batches.forEach((batch) => batch.update(deltaSeconds));
    this._texts.forEach((text) => text.update(deltaSeconds));
    this._batches = this.prune(this._batches, (batch) => batch.isFinished);
    this._texts = this.prune(this._texts, (text) => text.isFinished);
  }

  private burst(configs: readonly EmitterConfig[], position: Vec2, effectScale: number): void {
    configs.forEach((config) => this.addBatch(config, effectScale, () => position).burst(this._random));
  }

  private addBatch(config: EmitterConfig, effectScale: number, origin: () => Vec2, isHeld = false): ParticleBatch {
    const batch = new ParticleBatch(this._textures, config, effectScale, origin, isHeld);
    this._world.addChild(batch);
    this._batches = [...this._batches, batch];

    return batch;
  }

  private prune<T extends { destroy(): void }>(items: readonly T[], isDone: (item: T) => boolean): readonly T[] {
    return items.filter((item) => {
      if (isDone(item)) {
        item.destroy();

        return false;
      }

      return true;
    });
  }
}
