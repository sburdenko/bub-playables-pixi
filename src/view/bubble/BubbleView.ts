import type { Container } from 'pixi.js';
import { add, scale, vec2, ZERO, type Vec2 } from '../../core/math/Vec2';
import { evaluateCurve } from '../../domain/animation/Keyframes';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import { applyImpulse, SPRING_AT_REST, stepSpring, type SpringState } from '../../domain/physics/SpringMotion';
import type { IBubbleView } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';
import { SPAWN_CLIP, SPIN_CLIP } from './bubbleClips';

const BASE_RADIUS = 0.35;
const ROW_SORTING_STRIDE = 10;
const SHADOW = { offset: vec2(0, -0.03), scale: 0.161, order: -1 };
const BODY = { offset: vec2(0, -0.006), scale: 0.162, order: 0 };

/** Free bubbles (sling, flight) follow `setPosition`; placed ones sit on a cell and wobble around it. */
type Placement = { readonly kind: 'free'; readonly position: Vec2 } | { readonly kind: 'placed'; readonly rest: Vec2; readonly spring: SpringState };

type Clip = { readonly kind: 'none' } | { readonly kind: 'spawn'; readonly time: number } | { readonly kind: 'spin'; readonly time: number };

/**
 * A bubble as the Unity prefab draws it: shadow and body are separate world objects, so all shadows of a row sort
 * below all bodies of that row. The spawn clip scales both around the centre; the spin clip swaps body frames.
 */
export class BubbleView implements IBubbleView {
  readonly color: BubbleColor;
  private readonly _shadow: WorldSprite;
  private readonly _body: WorldSprite;
  private _layoutScale = 1;
  private _placement: Placement = { kind: 'free', position: ZERO };
  private _clip: Clip = { kind: 'none' };
  private _isDestroyed = false;

  constructor(textures: ITextureSource, color: BubbleColor, world: Container) {
    this.color = color;
    this._shadow = new WorldSprite(textures, 't-normal-shadow');
    this._body = new WorldSprite(textures, `t-normal-${color}`);
    this.setRow(0);
    world.addChild(this._shadow, this._body);
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
    this.sync();
  }

  place(rest: Vec2, row: number): void {
    this.setRow(row);
    this._clip = { kind: 'spawn', time: 0 };
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

  update(deltaSeconds: number): void {
    if (this._placement.kind === 'placed') {
      this._placement = { ...this._placement, spring: stepSpring(this._placement.spring, deltaSeconds) };
    }

    this._clip = advance(this._clip, deltaSeconds);
    this.sync();
  }

  destroy(): void {
    this._isDestroyed = true;
    this._shadow.destroy();
    this._body.destroy();
  }

  private setRow(row: number): void {
    this._shadow.zIndex = sortOrder(SHADOW.order + row * ROW_SORTING_STRIDE);
    this._body.zIndex = sortOrder(BODY.order + row * ROW_SORTING_STRIDE);
  }

  private sync(): void {
    const isSpinning = this._clip.kind === 'spin';
    const anchor = this._clip.kind === 'spawn'
      ? vec2(evaluateCurve(SPAWN_CLIP.scaleX, this._clip.time), evaluateCurve(SPAWN_CLIP.scaleY, this._clip.time))
      : vec2(1, 1);
    const spinFrames = SPIN_CLIP.frames(this.color);
    const spinFrame = this._clip.kind === 'spin' ? spinFrames[Math.floor(this._clip.time / SPIN_CLIP.frameSeconds) % spinFrames.length] : undefined;
    this._body.setTexture(spinFrame ?? `t-normal-${this.color}`);
    this._shadow.visible = !isSpinning;
    this.placePart(this._shadow, SHADOW.offset, SHADOW.scale, anchor);
    this.placePart(this._body, BODY.offset, isSpinning ? SPIN_CLIP.imageScale : BODY.scale, anchor);
  }

  private placePart(part: WorldSprite, offset: Vec2, partScale: number, anchor: Vec2): void {
    const scaledOffset = scale(vec2(offset.x * anchor.x, offset.y * anchor.y), this._layoutScale);
    part.position.copyFrom(add(this.position, scaledOffset));
    part.scale.set(partScale * anchor.x * this._layoutScale, partScale * anchor.y * this._layoutScale);
  }
}

function advance(clip: Clip, deltaSeconds: number): Clip {
  if (clip.kind === 'spawn') {
    const time = clip.time + deltaSeconds;

    return time >= SPAWN_CLIP.duration ? { kind: 'none' } : { kind: 'spawn', time };
  }

  return clip.kind === 'spin' ? { kind: 'spin', time: (clip.time + deltaSeconds) % SPIN_CLIP.duration } : clip;
}
