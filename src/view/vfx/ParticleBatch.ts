import { Container, Sprite } from 'pixi.js';
import type { Vec2 } from '../../core/math/Vec2';
import type { IRandom } from '../../core/random/IRandom';
import { emitBurst, particleLook, stepParticle, type EmitterConfig, type Particle } from '../../domain/vfx/Particles';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';

/** Draws one emitter's particles in the world. Particles positions are relative to `origin()` (local simulation). */
export class ParticleBatch extends Container {
  private readonly _textures: ITextureSource;
  private readonly _config: EmitterConfig;
  private readonly _effectScale: number;
  private readonly _originOf: () => Vec2;
  private _particles: readonly { readonly particle: Particle; readonly sprite: Sprite }[] = [];
  private _isHeld: boolean;

  /** `isHeld` keeps an emitter alive between bursts (a trail) until `release` is called. */
  constructor(textures: ITextureSource, config: EmitterConfig, effectScale: number, origin: () => Vec2, isHeld = false) {
    super();
    this._isHeld = isHeld;
    this._textures = textures;
    this._config = config;
    this._effectScale = effectScale;
    this._originOf = origin;
    this.zIndex = sortOrder(config.sortOrder);
  }

  get isFinished(): boolean {
    return !this._isHeld && this._particles.length === 0;
  }

  release(): void {
    this._isHeld = false;
  }

  /** Emits one burst at `localOffset` from the origin. */
  burst(random: IRandom, localOffset: Vec2 = { x: 0, y: 0 }): void {
    const born = emitBurst(this._config, localOffset, this._effectScale, random).map((particle) => ({ particle, sprite: this.createSprite() }));
    this._particles = [...this._particles, ...born];
  }

  update(deltaSeconds: number): void {
    this._particles = this._particles.flatMap(({ particle, sprite }) => {
      const next = stepParticle(particle, this._config, deltaSeconds, this._effectScale);
      if (next === null) {
        sprite.destroy();

        return [];
      }

      return [{ particle: next, sprite }];
    });
    this.draw();
  }

  private createSprite(): Sprite {
    const sprite = new Sprite(this._textures.get(this._config.textures[0] ?? ''));
    sprite.anchor.set(0.5);
    sprite.tint = this._config.tint;
    sprite.blendMode = this._config.isAdditive ? 'add' : 'normal';
    this.addChild(sprite);

    return sprite;
  }

  private draw(): void {
    const origin = this._originOf();
    for (const { particle, sprite } of this._particles) {
      const look = particleLook(particle, this._config);
      sprite.texture = this._textures.get(this._config.textures[look.textureIndex] ?? this._config.textures[0] ?? '');
      sprite.position.set(origin.x + particle.position.x, origin.y + particle.position.y);
      sprite.rotation = particle.rotation;
      sprite.alpha = look.alpha;
      sprite.scale.set(look.size / sprite.texture.width, -look.size / sprite.texture.width);
    }
  }
}
