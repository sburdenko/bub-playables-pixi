import { centerX, type Rect } from '../../core/math/Rect';
import { add, distance, length, normalize, scale, subtract, vec2, ZERO, type Vec2 } from '../../core/math/Vec2';
import { clampPull } from '../../domain/launcher/AimMath';
import type { IBubbleView } from '../ports/IBubbleView';
import type { PointerSample } from '../ports/IPointerSource';
import type { ISlingView } from '../ports/ISlingView';

const ANCHOR_HEIGHT_FROM_BOTTOM = 700 / 2436;
const MAX_PULL_DISTANCE = 0.85;
const MIN_LAUNCH_PULL = MAX_PULL_DISTANCE * 0.3;
const MAX_LAUNCH_ANGLE_DEGREES = 40;
const LAUNCH_SPEED = 12;
const GRAB_RADIUS_FACTOR = 1.8;
const MAX_AIM_LINE_LENGTH = 3.15;

export type Shot = { readonly bubble: IBubbleView; readonly position: Vec2; readonly velocity: Vec2 };

type AimingState = { readonly kind: 'aiming'; readonly bubble: IBubbleView; readonly pull: Vec2 };

type LauncherState = { readonly kind: 'empty' } | { readonly kind: 'ready'; readonly bubble: IBubbleView } | AimingState;

/** The sling: grab the loaded bubble, pull it down within a cone, release to shoot opposite to the pull. */
export class LauncherSystem {
  private readonly _sling: ISlingView;
  private _state: LauncherState = { kind: 'empty' };
  private _anchor: Vec2 = ZERO;
  private _layoutScale = 1;

  constructor(sling: ISlingView) {
    this._sling = sling;
  }

  get isEmpty(): boolean {
    return this._state.kind === 'empty';
  }

  get anchor(): Vec2 {
    return this._anchor;
  }

  applyLayout(visibleRect: Rect, layoutScale: number): void {
    this._anchor = vec2(centerX(visibleRect), visibleRect.yMin + visibleRect.height * ANCHOR_HEIGHT_FROM_BOTTOM);
    this._layoutScale = layoutScale;
    this._sling.setAnchor(this._anchor);
    if (this._state.kind !== 'empty') {
      this._state.bubble.setLayoutScale(layoutScale);
      this.resetPull(this._state.bubble);
    }
  }

  load(bubble: IBubbleView): void {
    this._sling.setAimColor(bubble.color);
    this.resetPull(bubble);
  }

  /** Follows this frame's pointer; returns the shot on the frame the bubble is released far enough. */
  update(pointer: PointerSample | null): Shot | null {
    if (pointer === null || this._state.kind === 'empty') {
      return null;
    }

    const state: LauncherState = this._state.kind === 'ready' && pointer.isPressedThisFrame && this.isGrabbing(pointer.pressWorld ?? pointer.world, this._state.bubble)
      ? { kind: 'aiming', bubble: this._state.bubble, pull: ZERO }
      : this._state;
    if (state.kind !== 'aiming') {
      return null;
    }

    const aimed = pointer.isHeld ? this.aim(state.bubble, pointer.world) : state;
    this._state = aimed;

    return pointer.isReleasedThisFrame ? this.release(aimed) : null;
  }

  private isGrabbing(pointer: Vec2, bubble: IBubbleView): boolean {
    return distance(pointer, this._anchor) <= bubble.radius * GRAB_RADIUS_FACTOR;
  }

  private aim(bubble: IBubbleView, pointer: Vec2): AimingState {
    const pull = clampPull(subtract(pointer, this._anchor), MAX_PULL_DISTANCE, MAX_LAUNCH_ANGLE_DEGREES);
    const pocket = add(this._anchor, pull);
    const strength = length(pull) / MAX_PULL_DISTANCE;
    bubble.setPosition(pocket);
    this._sling.showAim(pocket, scale(normalize(pull), -MAX_AIM_LINE_LENGTH * strength), strength, this._layoutScale);

    return { kind: 'aiming', bubble, pull };
  }

  private release(state: AimingState): Shot | null {
    if (length(state.pull) < MIN_LAUNCH_PULL) {
      this.resetPull(state.bubble);

      return null;
    }

    this._sling.release(add(this._anchor, state.pull), this._layoutScale);
    state.bubble.setPosition(this._anchor);
    this._state = { kind: 'empty' };

    return { bubble: state.bubble, position: this._anchor, velocity: scale(normalize(state.pull), -LAUNCH_SPEED) };
  }

  private resetPull(bubble: IBubbleView): void {
    bubble.setPosition(this._anchor);
    this._sling.showLoaded(this._anchor);
    this._state = { kind: 'ready', bubble };
  }
}
