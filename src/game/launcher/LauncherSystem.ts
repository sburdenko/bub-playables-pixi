import { centerX, type Rect } from '../../core/math/Rect';
import { add, distance, length, normalize, scale, subtract, vec2, ZERO, type Vec2 } from '../../core/math/Vec2';
import { BUBBLE_BASE_RADIUS } from '../../domain/board/BoardGeometry';
import type { LauncherRules } from '../../domain/config/GameConfig';
import { clampPull } from '../../domain/launcher/AimMath';
import type { IBubbleView } from '../ports/IBubbleView';
import type { PointerSample } from '../ports/IPointerSource';
import type { ISlingView } from '../ports/ISlingView';
import type { ITurnLauncher, Shot } from '../ports/ITurnLauncher';

const ANCHOR_HEIGHT_FROM_BOTTOM = 700 / 2436;
const MAX_AIM_LINE_LENGTH = 3.15;

type AimingState = { readonly kind: 'aiming'; readonly bubble: IBubbleView; readonly pull: Vec2 };

type LauncherState = { readonly kind: 'empty' } | { readonly kind: 'ready'; readonly bubble: IBubbleView } | AimingState;

/** The sling: grab the loaded bubble, pull it down within a cone, release to shoot opposite to the pull. */
export class LauncherSystem implements ITurnLauncher {
  private readonly _sling: ISlingView;
  private readonly _rules: LauncherRules;
  private _state: LauncherState = { kind: 'empty' };
  private _anchor: Vec2 = ZERO;
  private _layoutScale = 1;

  constructor(sling: ISlingView, rules: LauncherRules) {
    this._sling = sling;
    this._rules = rules;
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

    const state: LauncherState = this._state.kind === 'ready' && pointer.isPressedThisFrame && this.isGrabbing(pointer.pressWorld ?? pointer.world)
      ? { kind: 'aiming', bubble: this._state.bubble, pull: ZERO }
      : this._state;
    if (state.kind !== 'aiming') {
      return null;
    }

    if (pointer.isCancelledThisFrame) {
      this.resetPull(state.bubble);

      return null;
    }

    const aimed = pointer.isHeld ? this.aim(state.bubble, pointer.world) : state;
    this._state = aimed;

    return pointer.isReleasedThisFrame ? this.release(aimed) : null;
  }

  private isGrabbing(pointer: Vec2): boolean {
    return distance(pointer, this._anchor) <= BUBBLE_BASE_RADIUS * this._layoutScale * this._rules.grabRadiusFactor;
  }

  private aim(bubble: IBubbleView, pointer: Vec2): AimingState {
    const pull = clampPull(subtract(pointer, this._anchor), this._rules.maxPullDistance, this._rules.maxLaunchAngleDegrees);
    const pocket = add(this._anchor, pull);
    const strength = length(pull) / this._rules.maxPullDistance;
    bubble.setPosition(pocket);
    this._sling.showAim(pocket, scale(normalize(pull), -MAX_AIM_LINE_LENGTH * strength), strength, this._layoutScale);

    return { kind: 'aiming', bubble, pull };
  }

  private release(state: AimingState): Shot | null {
    if (length(state.pull) < this._rules.maxPullDistance * this._rules.minPullShare) {
      this.resetPull(state.bubble);

      return null;
    }

    this._sling.release(add(this._anchor, state.pull), this._layoutScale);
    state.bubble.setPosition(this._anchor);
    this._state = { kind: 'empty' };

    return { bubble: state.bubble, position: this._anchor, velocity: scale(normalize(state.pull), -this._rules.launchSpeed) };
  }

  private resetPull(bubble: IBubbleView): void {
    bubble.setPosition(this._anchor);
    this._sling.showLoaded(this._anchor);
    this._state = { kind: 'ready', bubble };
  }
}
