import type { Container } from 'pixi.js';
import { add, scale, vec2, ZERO, type Vec2 } from '../../core/math/Vec2';
import { evaluateCurve } from '../../domain/animation/Keyframes';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import { applyImpulse, SPRING_AT_REST, stepSpring, type SpringState } from '../../domain/physics/SpringMotion';
import type { IBubbleView } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';
import { SPAWN_CLIP } from './bubbleClips';

const BASE_RADIUS = 0.35;
const ROW_SORTING_STRIDE = 10;

/** One image of the bubble prefab: offset and scale inside the bubble, draw order inside its row. */
type Part = { readonly sprite: WorldSprite; readonly offset: Vec2; readonly scale: number; readonly order: number };

type Clip = { readonly kind: 'none' } | { readonly kind: 'spawn'; readonly time: number };

/**
 * A bubble as the Unity prefab draws it: shadow and body as separate world objects, so that all shadows of a row sort
 * below all bodies of that row. Position = rest + spring wobble; the spawn clip scales both around the centre.
 */
export class BubbleView implements IBubbleView {
  readonly color: BubbleColor;
  private readonly _parts: readonly Part[];
  private _layoutScale = 1;
  private _rest: Vec2 = ZERO;
  private _spring: SpringState = SPRING_AT_REST;
  private _clip: Clip = { kind: 'none' };
  private _isDestroyed = false;

  constructor(textures: ITextureSource, color: BubbleColor, world: Container) {
    this.color = color;
    this._parts = [
      { sprite: new WorldSprite(textures, 't-normal-shadow'), offset: vec2(0, -0.03), scale: 0.161, order: -1 },
      { sprite: new WorldSprite(textures, `t-normal-${color}`), offset: vec2(0, -0.006), scale: 0.162, order: 0 },
    ];
    world.addChild(...this._parts.map((part) => part.sprite));
  }

  get radius(): number {
    return BASE_RADIUS * this._layoutScale;
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  setLayoutScale(layoutScale: number): void {
    this._layoutScale = layoutScale;
    this.sync();
  }

  place(rest: Vec2, row: number): void {
    this._parts.forEach((part) => (part.sprite.zIndex = sortOrder(part.order + row * ROW_SORTING_STRIDE)));
    this._clip = { kind: 'spawn', time: 0 };
    this.setRestPosition(rest);
  }

  setRestPosition(rest: Vec2): void {
    this._rest = rest;
    this._spring = SPRING_AT_REST;
    this.sync();
  }

  applyImpact(direction: Vec2, strength: number): void {
    this._spring = applyImpulse(this._spring, direction, strength);
  }

  update(deltaSeconds: number): void {
    this._spring = stepSpring(this._spring, deltaSeconds);
    if (this._clip.kind === 'spawn') {
      const time = this._clip.time + deltaSeconds;
      this._clip = time >= SPAWN_CLIP.duration ? { kind: 'none' } : { kind: 'spawn', time };
    }

    this.sync();
  }

  destroy(): void {
    this._isDestroyed = true;
    this._parts.forEach((part) => part.sprite.destroy());
  }

  private sync(): void {
    const center = add(this._rest, this._spring.offset);
    const anchor = this.anchorScale();
    for (const part of this._parts) {
      const offset = vec2(part.offset.x * anchor.x, part.offset.y * anchor.y);
      part.sprite.position.copyFrom(add(center, scale(offset, this._layoutScale)));
      part.sprite.scale.set(part.scale * anchor.x * this._layoutScale, part.scale * anchor.y * this._layoutScale);
    }
  }

  private anchorScale(): Vec2 {
    return this._clip.kind === 'spawn'
      ? vec2(evaluateCurve(SPAWN_CLIP.scaleX, this._clip.time), evaluateCurve(SPAWN_CLIP.scaleY, this._clip.time))
      : vec2(1, 1);
  }
}
