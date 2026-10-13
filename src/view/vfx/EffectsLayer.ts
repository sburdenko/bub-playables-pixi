import { Sprite, type Container } from 'pixi.js';
import { distance, type Vec2 } from '../../core/math/Vec2';
import { KeyedPool } from '../../core/pool/KeyedPool';
import { ObjectPool } from '../../core/pool/ObjectPool';
import type { IRandom } from '../../core/random/IRandom';
import { emitAlongPath, type EmitterConfig } from '../../domain/vfx/Particles';
import type { BurstKind, IEffects, TextKind } from '../../game/ports/IAttackViews';
import type { ITextureSource } from '../assets/ITextureSource';
import type { WorldLayers } from '../scene/WorldLayers';
import { ENEMY_IMPACT, ENERGY_BURST, MATCH_GLOW, TRAIL_RATE_PER_UNIT, TRAIL_SCALE, TRAIL_TWINKLE, TRAILING_IMPACT } from './effectConfigs';
import { FloatingText, textKey } from './FloatingText';
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
  private readonly _layers: WorldLayers;
  private readonly _random: IRandom;
  private readonly _sprites = new ObjectPool<Sprite>(createParticleSprite, hide);
  private readonly _textPool = new KeyedPool<string, FloatingText>(createFloatingText, hide);
  private _batches: readonly ParticleBatch[] = [];
  private _texts: readonly { readonly key: string; readonly text: FloatingText }[] = [];

  constructor(textures: ITextureSource, layers: WorldLayers, random: IRandom) {
    this._textures = textures;
    this._layers = layers;
    this._random = random;
  }

  spawnBurst(kind: BurstKind, position: Vec2, effectScale: number): void {
    this.burst(BURSTS[kind], position, effectScale);
  }

  spawnText(kind: TextKind, position: Vec2, value: number, layoutScale: number): void {
    const key = textKey(kind, value);
    const text = this._textPool.acquire(key);
    text.restart(position, layoutScale);
    this._layers.foreground.addChild(text);
    this._texts = [...this._texts, { key, text }];
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
        const path = emitAlongPath(carried, origin === null ? 0 : distance(origin, position), TRAIL_RATE_PER_UNIT);
        carried = path.carried;
        origin = position;
        for (let index = 0; index < path.count; index++) {
          batch.burst(this._random);
        }
      },
      // The last origin is kept so sparkles still alive stay where the bubble stopped.
      stop: () => {
        batch?.release();
        batch = null;
        carried = 0;
      },
    };
  }

  update(deltaSeconds: number): void {
    this._batches.forEach((batch) => batch.update(deltaSeconds));
    this._texts.forEach(({ text }) => text.update(deltaSeconds));
    this._batches = this.prune(this._batches, (batch) => batch.isFinished);
    this._texts.filter(({ text }) => text.isFinished).forEach(({ key, text }) => this._textPool.release(key, text));
    this._texts = this._texts.filter(({ text }) => !text.isFinished);
  }

  private burst(configs: readonly EmitterConfig[], position: Vec2, effectScale: number): void {
    configs.forEach((config) => this.addBatch(config, effectScale, () => position).burst(this._random));
  }

  private addBatch(config: EmitterConfig, effectScale: number, origin: () => Vec2, isHeld = false): ParticleBatch {
    const batch = new ParticleBatch(this._textures, config, effectScale, origin, this._sprites, isHeld);
    this._layers.gameplay.addChild(batch);
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

function createParticleSprite(): Sprite {
  const sprite = new Sprite();
  sprite.anchor.set(0.5);

  return sprite;
}

function createFloatingText(key: string): FloatingText {
  const [kind, value] = key.split(':');

  return new FloatingText(kind as TextKind, Number(value));
}

function hide(item: Container): void {
  item.removeFromParent();
  item.visible = false;
}
