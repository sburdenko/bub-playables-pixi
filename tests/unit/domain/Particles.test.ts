import { describe, expect, it } from 'vitest';
import { length, vec2 } from '../../../src/core/math/Vec2';
import { SeededRandom } from '../../../src/core/random/SeededRandom';
import { emitAlongPath, emitBurst, particleLook, sampleLifeCurve, stepParticle, type EmitterConfig, type Particle } from '../../../src/domain/vfx/Particles';

const CONFIG: EmitterConfig = {
  textures: ['a', 'b', 'c'],
  isFlipbook: false,
  count: [12, 12],
  lifetime: [0.5, 0.5],
  speed: [10, 10],
  size: [0.4, 0.4],
  rotation: [0, 0],
  radius: 0.1,
  arcDegrees: 360,
  speedLimit: { magnitude: 0.5, dampen: 0.7 },
  sizeOverLife: [[0, 0], [0.5, 1], [1, 0]],
  alphaOverLife: [[0, 1], [1, 0]],
  startAlpha: 0.8,
  tint: 0xffffff,
  isAdditive: true,
  sortOrder: 3,
};

describe('Particles', () => {
  it('burstEmitsTheConfiguredCountAroundTheOriginScaled', () => {
    const particles = emitBurst(CONFIG, vec2(1, 2), 2, new SeededRandom(1));

    expect(particles).toHaveLength(12);
    for (const particle of particles) {
      expect(length(vec2(particle.position.x - 1, particle.position.y - 2))).toBeCloseTo(0.2, 10);
      expect(length(particle.velocity)).toBeCloseTo(20, 10);
      expect(particle.size).toBeCloseTo(0.8, 10);
    }
  });

  it('speedLimitBrakesFastParticlesTowardsTheLimit', () => {
    const [particle] = emitBurst(CONFIG, vec2(0, 0), 1, new SeededRandom(2));
    let current: Particle | null = particle ?? null;
    for (let frame = 0; frame < 20 && current !== null; frame++) {
      current = stepParticle(current, CONFIG, 1 / 60, 1);
    }

    expect(length(current?.velocity ?? vec2(0, 0))).toBeLessThan(1);
    expect(length(current?.velocity ?? vec2(0, 0))).toBeGreaterThanOrEqual(0.5 - 1e-9);
  });

  it('particlesExpireAfterTheirLifetime', () => {
    const [particle] = emitBurst(CONFIG, vec2(0, 0), 1, new SeededRandom(3));

    expect(particle && stepParticle(particle, CONFIG, 0.6, 1)).toBeNull();
  });

  it('lookFollowsTheLifeCurvesAndFlipbook', () => {
    const [particle] = emitBurst({ ...CONFIG, isFlipbook: true }, vec2(0, 0), 1, new SeededRandom(4));
    const halfway = particle && { ...particle, age: 0.25 };
    const look = halfway && particleLook(halfway, { ...CONFIG, isFlipbook: true });

    expect(look?.size).toBeCloseTo(0.4, 10);
    expect(look?.alpha).toBeCloseTo(0.4, 10);
    expect(look?.textureIndex).toBe(1);
  });

  it('emitAlongPathCarriesTheRemainderAcrossFrames', () => {
    const first = emitAlongPath(0, 0.05, 50);
    const second = emitAlongPath(first.carried, 0.03, 50);

    expect(first.count).toBe(2);
    expect(first.carried).toBeCloseTo(0.5, 10);
    expect(second.count).toBe(2);
    expect(second.carried).toBeCloseTo(0, 10);
  });

  it('lifeCurveIsLinearAndClamped', () => {
    expect(sampleLifeCurve([[0.2, 1], [0.6, 3]], 0)).toBe(1);
    expect(sampleLifeCurve([[0.2, 1], [0.6, 3]], 0.4)).toBeCloseTo(2, 10);
    expect(sampleLifeCurve([[0.2, 1], [0.6, 3]], 1)).toBe(3);
    expect(sampleLifeCurve([], 0.5)).toBe(1);
  });
});
