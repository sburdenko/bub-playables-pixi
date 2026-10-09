import type { EmitterConfig, LifeCurve } from '../../domain/vfx/Particles';

/** Curves shared by the Unity twinkle systems (size and alpha over lifetime). */
const TWINKLE_SIZE: LifeCurve = [[0.0127, 0], [0.2743, 1], [0.8123, 0.7889], [1, 0]];
const TWINKLE_ALPHA: LifeCurve = [[0, 1], [0.5162, 0.9412], [0.6971, 0.9433], [0.861, 0.334], [1, 0]];
const GLOW_SIZE: LifeCurve = [[0, 0.3526], [0.2623, 0.9427], [1, 1]];
const STEADY: LifeCurve = [[0, 1], [1, 1]];
const HIT_YELLOW = 0xfff900;
const MATCH_GLOW_PREFAB_SCALE = 0.4;

const base = {
  isFlipbook: false,
  rotation: [0, 0],
  radius: 0,
  arcDegrees: 360,
  speedLimit: null,
  sizeOverLife: STEADY,
  alphaOverLife: STEADY,
  startAlpha: 1,
  tint: 0xffffff,
  isAdditive: false,
  sortOrder: 3,
} as const;

/** PS_VFX_EnemyHit_TrailingImpact: yellow sparkles where a bubble reaches the orb and where the orb hits. */
export const TRAILING_IMPACT: readonly EmitterConfig[] = [
  { ...base, textures: ['t-vfx-twinkle-04'], count: [12, 12], lifetime: [0.45, 0.7], speed: [2.5, 5], size: [0.2, 0.4], sizeOverLife: TWINKLE_SIZE, alphaOverLife: TWINKLE_ALPHA, tint: HIT_YELLOW },
];

/** PS_VFX_EnemyHit_Impact: a fast yellow spray on the enemy that brakes almost at once. */
export const ENEMY_IMPACT: readonly EmitterConfig[] = [
  { ...base, textures: ['t-vfx-twinkle-04'], count: [24, 24], lifetime: [0.2, 0.45], speed: [5, 30], size: [0.1, 1], radius: 0.02, speedLimit: { magnitude: 0.5, dampen: 0.7 }, sizeOverLife: TWINKLE_SIZE, alphaOverLife: TWINKLE_ALPHA, tint: HIT_YELLOW },
];

/** PS_VFX_EnergyBubble_Burst: three bubble shards thrown upwards and an expanding ring. */
export const ENERGY_BURST: readonly EmitterConfig[] = [
  { ...base, textures: ['t-bb-particle-01-0'], count: [3, 3], lifetime: [0.3, 0.5], speed: [15, 25], size: [0.5, 0.8], rotation: [-0.5236, 0.5236], arcDegrees: 180, speedLimit: { magnitude: 1, dampen: 0.4 }, sizeOverLife: [[0, 0.498], [0.1186, 1], [0.322, 0.8514], [0.6813, 0.9639], [1, 0.2088]] },
  {
    ...base,
    textures: Array.from({ length: 9 }, (_, index) => `t-circle-sq-02-${index}`),
    isFlipbook: true,
    count: [1, 1],
    lifetime: [0.35, 0.35],
    speed: [0, 0],
    size: [2, 2],
    rotation: [0, Math.PI * 2],
    sizeOverLife: [[0, 0.1727], [0.0742, 0.7917], [1, 1]],
    isAdditive: true,
  },
];

/** PS_VFX_Normal_Match (activate): two additive glows behind a popping bubble. */
export const MATCH_GLOW: readonly EmitterConfig[] = [
  { ...base, textures: ['t-vfx-glow-01'], count: [1, 1], lifetime: [0.4, 0.4], speed: [0, 0], size: [2 * MATCH_GLOW_PREFAB_SCALE, 2 * MATCH_GLOW_PREFAB_SCALE], sizeOverLife: GLOW_SIZE, isAdditive: true, sortOrder: -2 },
  { ...base, textures: ['t-vfx-glow-02'], count: [1, 1], lifetime: [0.4, 0.4], speed: [0, 0], size: [2.56 * MATCH_GLOW_PREFAB_SCALE, 2.56 * MATCH_GLOW_PREFAB_SCALE], sizeOverLife: GLOW_SIZE, startAlpha: 0.6039, isAdditive: true, sortOrder: -3 },
];

/** PS_VFX_BB_ClusterPaintBomb_Trail twinkles, emitted per distance travelled around a flying bubble. */
export const TRAIL_TWINKLE: EmitterConfig = {
  ...base,
  textures: ['t-vfx-glow-02'],
  count: [1, 1],
  lifetime: [0.2, 0.3],
  speed: [0, 5],
  size: [0.4, 0.7],
  radius: 0.1,
  speedLimit: { magnitude: 0.5, dampen: 0.7 },
  sizeOverLife: TWINKLE_SIZE,
  alphaOverLife: [[0, 0], [0.1735, 1], [0.5162, 0.9412], [0.6971, 0.9433], [0.861, 0.334], [1, 0]],
};

/** Trail particles per world unit travelled (Unity `rateOverDistance`) and the trail object's scale in the prefab. */
export const TRAIL_RATE_PER_UNIT = 50;
export const TRAIL_SCALE = 0.6;
