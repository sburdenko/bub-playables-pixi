import { clamp01, degreesToRadians, lerp } from '../../core/math/Scalar';
import { add, length, scale, vec2, type Vec2 } from '../../core/math/Vec2';
import { randomRange, type IRandom } from '../../core/random/IRandom';

export type Range = readonly [number, number];

/** Piecewise-linear curve over a particle's normalized age: `[age, value]` points. */
export type LifeCurve = readonly (readonly [number, number])[];

/**
 * One Unity particle-system burst, reduced to what these effects use: a burst count, start ranges, emission from a
 * circle arc, a speed limit with dampening, and size / alpha over lifetime. Values are in world units at scale 1.
 */
export type EmitterConfig = {
  readonly textures: readonly string[];
  /** When true the textures are a flipbook played over each particle's life; otherwise one is picked at random. */
  readonly isFlipbook: boolean;
  readonly count: Range;
  readonly lifetime: Range;
  readonly speed: Range;
  readonly size: Range;
  readonly rotation: Range;
  readonly radius: number;
  readonly arcDegrees: number;
  readonly speedLimit: { readonly magnitude: number; readonly dampen: number } | null;
  readonly sizeOverLife: LifeCurve;
  readonly alphaOverLife: LifeCurve;
  readonly startAlpha: number;
  readonly tint: number;
  readonly isAdditive: boolean;
  readonly sortOrder: number;
};

export type Particle = {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly age: number;
  readonly lifetime: number;
  readonly size: number;
  readonly rotation: number;
  readonly textureIndex: number;
};

export type ParticleLook = { readonly alpha: number; readonly size: number; readonly textureIndex: number };

/** Unity applies the speed-limit dampening per frame; this normalizes it to a 30 fps step. */
const DAMPEN_REFERENCE_FPS = 30;

export function emitBurst(config: EmitterConfig, origin: Vec2, effectScale: number, random: IRandom): Particle[] {
  const count = Math.round(randomRange(random, config.count[0], config.count[1]));

  return Array.from({ length: count }, () => {
    const angle = degreesToRadians(randomRange(random, 0, config.arcDegrees));
    const direction = vec2(Math.cos(angle), Math.sin(angle));

    return {
      position: add(origin, scale(direction, config.radius * effectScale)),
      velocity: scale(direction, randomRange(random, config.speed[0], config.speed[1]) * effectScale),
      age: 0,
      lifetime: randomRange(random, config.lifetime[0], config.lifetime[1]),
      size: randomRange(random, config.size[0], config.size[1]) * effectScale,
      rotation: randomRange(random, config.rotation[0], config.rotation[1]),
      textureIndex: config.isFlipbook ? 0 : Math.floor(random.next() * config.textures.length),
    };
  });
}

/** Ages and moves a particle; returns null once it has expired. */
export function stepParticle(particle: Particle, config: EmitterConfig, deltaSeconds: number, effectScale: number): Particle | null {
  const age = particle.age + deltaSeconds;
  if (age >= particle.lifetime) {
    return null;
  }

  const velocity = limitSpeed(particle.velocity, config, deltaSeconds, effectScale);

  return { ...particle, age, velocity, position: add(particle.position, scale(velocity, deltaSeconds)) };
}

export function particleLook(particle: Particle, config: EmitterConfig): ParticleLook {
  const life = clamp01(particle.age / particle.lifetime);
  const textureIndex = config.isFlipbook ? Math.min(config.textures.length - 1, Math.floor(life * config.textures.length)) : particle.textureIndex;

  return {
    alpha: config.startAlpha * sampleLifeCurve(config.alphaOverLife, life),
    size: particle.size * sampleLifeCurve(config.sizeOverLife, life),
    textureIndex,
  };
}

export function sampleLifeCurve(curve: LifeCurve, life: number): number {
  const first = curve[0];
  if (first === undefined) {
    return 1;
  }

  const nextIndex = curve.findIndex(([time]) => time > life);
  if (nextIndex <= 0) {
    return nextIndex === 0 ? first[1] : (curve[curve.length - 1]?.[1] ?? 1);
  }

  const [startTime, startValue] = curve[nextIndex - 1] ?? first;
  const [endTime, endValue] = curve[nextIndex] ?? first;

  return lerp(startValue, endValue, (life - startTime) / (endTime - startTime));
}

function limitSpeed(velocity: Vec2, config: EmitterConfig, deltaSeconds: number, effectScale: number): Vec2 {
  if (config.speedLimit === null) {
    return velocity;
  }

  const speed = length(velocity);
  const limit = config.speedLimit.magnitude * effectScale;
  if (speed <= limit) {
    return velocity;
  }

  const keep = Math.pow(1 - config.speedLimit.dampen, deltaSeconds * DAMPEN_REFERENCE_FPS);

  return scale(velocity, (limit + (speed - limit) * keep) / speed);
}
