import type { Container } from 'pixi.js';
import { add, rotate, scale, vec2, ZERO, type Vec2 } from '../../core/math/Vec2';
import { evaluateCurve } from '../../domain/animation/Keyframes';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import { applyImpulse, SPRING_AT_REST, stepSpring, type SpringState } from '../../domain/physics/SpringMotion';
import type { IBubbleView } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';
import type { EffectsLayer, ITrail } from '../vfx/EffectsLayer';
import { MATCH_CLIP, SPAWN_CLIP, SPIN_CLIP } from './bubbleClips';

const BASE_RADIUS = 0.35;
const ROW_SORTING_STRIDE = 10;
const SHADOW = { offset: vec2(0, -0.03), scale: 0.161, order: -1 };
const BODY = { offset: vec2(0, -0.006), scale: 0.162, order: 0 };

/** Free bubbles (sling, flight, collect) follow `setPosition`; placed ones sit on a cell and wobble around it. */
type Placement = { readonly kind: 'free'; readonly position: Vec2 } | { readonly kind: 'placed'; readonly rest: Vec2; readonly spring: SpringState };

type Clip =
  | { readonly kind: 'none' }
  | { readonly kind: 'spawn'; readonly time: number }
  | { readonly kind: 'spin'; readonly time: number }
  | { readonly kind: 'match'; readonly time: number };

/** How the clip shapes the bubble this frame. */
type Pose = { readonly anchor: Vec2; readonly shadowAlpha: number; readonly flashAlpha: number; readonly bodyTexture: string; readonly bodyScale: number };

/**
 * A bubble as the Unity prefab draws it. Shadow, body and the additive flash are separate world objects so all
 * shadows of a row sort below all bodies of that row; collected bubbles move to the top layer.
 */
export class BubbleView implements IBubbleView {
  readonly color: BubbleColor;
  private readonly _effects: EffectsLayer;
  private readonly _shadow: WorldSprite;
  private readonly _body: WorldSprite;
  private readonly _flash: WorldSprite;
  private _layoutScale = 1;
  private _placement: Placement = { kind: 'free', position: ZERO };
  private _clip: Clip = { kind: 'none' };
  private _rotation = 0;
  private _shrink = 1;
  private _trail: ITrail | null = null;
  private _isDestroyed = false;

  constructor(textures: ITextureSource, color: BubbleColor, world: Container, effects: EffectsLayer) {
    this.color = color;
    this._effects = effects;
    this._shadow = new WorldSprite(textures, 't-normal-shadow');
    this._body = new WorldSprite(textures, `t-normal-${color}`);
    this._flash = new WorldSprite(textures, `t-normal-${color}`);
    this._flash.blendMode = 'add';
    this.setSorting(0, 'default');
    world.addChild(this._shadow, this._body, this._flash);
  }

  get radius(): number {
    return BASE_RADIUS * this._layoutScale;
  }

  get position(): Vec2 {
    return this._placement.kind === 'free' ? this._placement.position : add(this._placement.rest, this._placement.spring.offset);
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  setLayoutScale(layoutScale: number): void {
    this._layoutScale = layoutScale;
    this.sync();
  }

  setPosition(position: Vec2): void {
    this._placement = { kind: 'free', position };
    this.sync();
  }

  playLaunch(): void {
    this._clip = { kind: 'spin', time: 0 };
    this._trail = this._effects.createTrail();
    this.sync();
  }

  place(rest: Vec2, row: number): void {
    this.setSorting(row, 'default');
    this._clip = { kind: 'spawn', time: 0 };
    this.stopTrail();
    this.setRestPosition(rest);
  }

  setRestPosition(rest: Vec2): void {
    this._placement = { kind: 'placed', rest, spring: SPRING_AT_REST };
    this.sync();
  }

  applyImpact(direction: Vec2, strength: number): void {
    if (this._placement.kind === 'placed') {
      this._placement = { ...this._placement, spring: applyImpulse(this._placement.spring, direction, strength) };
    }
  }

  playMatch(): void {
    this._clip = { kind: 'match', time: 0 };
    this._effects.spawnMatchGlow(this.position, this._layoutScale);
    this.sync();
  }

  beginCollect(): void {
    this._placement = { kind: 'free', position: this.position };
    this.setSorting(0, 'top');
    this._trail = this._effects.createTrail();
  }

  stopAnimation(): void {
    this._clip = { kind: 'none' };
    this.sync();
  }

  rotateBy(radians: number): void {
    this._rotation += radians;
  }

  setShrink(factor: number): void {
    this._shrink = factor;
    this.sync();
  }

  update(deltaSeconds: number): void {
    if (this._placement.kind === 'placed') {
      this._placement = { ...this._placement, spring: stepSpring(this._placement.spring, deltaSeconds) };
    }

    this._clip = advance(this._clip, deltaSeconds);
    this.sync();
  }

  destroy(): void {
    this._isDestroyed = true;
    this.stopTrail();
    [this._shadow, this._body, this._flash].forEach((part) => part.destroy());
  }

  private setSorting(row: number, layer: 'default' | 'top'): void {
    this._shadow.zIndex = sortOrder(SHADOW.order + row * ROW_SORTING_STRIDE, layer);
    this._body.zIndex = sortOrder(BODY.order + row * ROW_SORTING_STRIDE, layer);
    this._flash.zIndex = sortOrder(BODY.order + row * ROW_SORTING_STRIDE, layer);
  }

  private stopTrail(): void {
    this._trail?.stop();
    this._trail = null;
  }

  private sync(): void {
    const pose = this.pose();
    this._body.setTexture(pose.bodyTexture);
    this._shadow.alpha = pose.shadowAlpha;
    this._flash.alpha = pose.flashAlpha;
    this._flash.visible = pose.flashAlpha > 0;
    this.placePart(this._shadow, SHADOW.offset, SHADOW.scale, pose.anchor);
    this.placePart(this._body, BODY.offset, pose.bodyScale, pose.anchor);
    this.placePart(this._flash, BODY.offset, BODY.scale, pose.anchor);
    this._trail?.follow(this.position, this._layoutScale);
  }

  private pose(): Pose {
    const clip = this._clip;
    const plain: Pose = { anchor: vec2(1, 1), shadowAlpha: 1, flashAlpha: 0, bodyTexture: `t-normal-${this.color}`, bodyScale: BODY.scale };
    switch (clip.kind) {
      case 'none':
        return plain;
      case 'spawn':
        return { ...plain, anchor: vec2(evaluateCurve(SPAWN_CLIP.scaleX, clip.time), evaluateCurve(SPAWN_CLIP.scaleY, clip.time)) };
      case 'spin': {
        const frames = SPIN_CLIP.frames(this.color);
        const frame = frames[Math.floor(clip.time / SPIN_CLIP.frameSeconds) % frames.length] ?? plain.bodyTexture;

        return { ...plain, shadowAlpha: 0, bodyTexture: frame, bodyScale: SPIN_CLIP.imageScale };
      }
      case 'match':
        return {
          ...plain,
          anchor: vec2(evaluateCurve(MATCH_CLIP.scaleX, clip.time), evaluateCurve(MATCH_CLIP.scaleY, clip.time)),
          shadowAlpha: evaluateCurve(MATCH_CLIP.shadowAlpha, clip.time),
          flashAlpha: evaluateCurve(MATCH_CLIP.flashAlpha, clip.time),
        };
    }
  }

  private placePart(part: WorldSprite, offset: Vec2, partScale: number, anchor: Vec2): void {
    const size = this._layoutScale * this._shrink;
    const localOffset = rotate(vec2(offset.x * anchor.x, offset.y * anchor.y), this._rotation);
    part.position.copyFrom(add(this.position, scale(localOffset, size)));
    part.scale.set(partScale * anchor.x * size, partScale * anchor.y * size);
    part.rotation = this._rotation;
  }
}

function advance(clip: Clip, deltaSeconds: number): Clip {
  switch (clip.kind) {
    case 'none':
      return clip;
    case 'spin':
      return { kind: 'spin', time: (clip.time + deltaSeconds) % SPIN_CLIP.duration };
    case 'spawn':
    case 'match': {
      const time = clip.time + deltaSeconds;
      const duration = clip.kind === 'spawn' ? SPAWN_CLIP.duration : MATCH_CLIP.duration;

      return time >= duration && clip.kind === 'spawn' ? { kind: 'none' } : { kind: clip.kind, time: Math.min(time, duration) };
    }
  }
}
