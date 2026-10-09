import type { Container } from 'pixi.js';
import { lerp } from '../../core/math/Scalar';
import { add, distance, scale, subtract, vec2, type Vec2 } from '../../core/math/Vec2';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import type { ISlingView } from '../../game/ports/ISlingView';
import type { ITextureSource } from '../assets/ITextureSource';
import { AIM_COLORS } from '../bubble/bubbleClips';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';
import { TaperedLine, TexturedLine } from './StretchedLine';

const BAND_COLOR = 0x66f2ff;
const RETURN_SPEED = 12;
const POST_OFFSET_X = 1;
const POST_SCALE = 0.3;
const GLOW = { color: 0x00eeff, minScale: 0.675, maxScale: 1.0125, maxAlpha: 0.9 };

type Pocket = { readonly kind: 'held'; readonly position: Vec2 } | { readonly kind: 'returning'; readonly position: Vec2; readonly speed: number };

/** Sling posts, the two bands to the pocket, the aim line (front in the shot's colour, glow behind) and the pull glow. */
export class SlingView implements ISlingView {
  private readonly _leftPost: WorldSprite;
  private readonly _rightPost: WorldSprite;
  private readonly _leftBand = new TaperedLine({ startWidth: 0.096, endWidth: 0.065, color: BAND_COLOR, startAlpha: 0.9, endAlpha: 0.15 });
  private readonly _rightBand = new TaperedLine({ startWidth: 0.096, endWidth: 0.065, color: BAND_COLOR, startAlpha: 0.9, endAlpha: 0.15 });
  private readonly _aimFront = new TaperedLine({ startWidth: 0.24, endWidth: 0.04, color: BAND_COLOR, startAlpha: 1, endAlpha: 1 });
  private readonly _aimBack: TexturedLine;
  private readonly _glow: WorldSprite;
  private _anchor: Vec2 = vec2(0, 0);
  private _pocket: Pocket = { kind: 'held', position: vec2(0, 0) };

  constructor(textures: ITextureSource) {
    this._leftPost = new WorldSprite(textures, 't-gameui-sling-hero');
    this._rightPost = new WorldSprite(textures, 't-gameui-sling-hero');
    this._aimBack = new TexturedLine(textures.get('t-vfx-bubble-trail-01'), 1.7, BAND_COLOR, 0.5);
    this._glow = new WorldSprite(textures, 'launcherpullglow');
    this._glow.setTint(GLOW.color);
    this.order([this._leftPost, 0], [this._rightPost, 0], [this._leftBand, -10], [this._rightBand, -10], [this._aimFront, -10], [this._aimBack, -11], [this._glow, -2]);
    this.setAimVisible(false);
    this._glow.alpha = 0;
  }

  /** The sling's parts join the world directly so they sort against bubbles and the frame. */
  get parts(): readonly Container[] {
    return [this._leftPost, this._rightPost, this._leftBand, this._rightBand, this._aimFront, this._aimBack, this._glow];
  }

  setAnchor(anchor: Vec2): void {
    this._anchor = anchor;
    this._leftPost.position.set(anchor.x - POST_OFFSET_X, anchor.y);
    this._rightPost.position.set(anchor.x + POST_OFFSET_X, anchor.y);
    this._leftPost.scale.set(POST_SCALE);
    this._rightPost.scale.set(POST_SCALE);
  }

  setAimColor(color: BubbleColor): void {
    this._aimFront.setColor(AIM_COLORS[color]);
  }

  showLoaded(pocket: Vec2): void {
    this.holdPocket(pocket);
    this.setAimVisible(false);
    this._glow.alpha = 0;
  }

  showAim(pocket: Vec2, aim: Vec2, strength: number, layoutScale: number): void {
    this.holdPocket(pocket);
    this.setAimVisible(strength > 0);
    this._aimFront.stretch(pocket, add(pocket, aim));
    this._aimBack.stretch(pocket, add(pocket, aim));
    this._glow.position.set(pocket.x, pocket.y);
    this._glow.scale.set(lerp(GLOW.minScale, GLOW.maxScale, strength) * layoutScale);
    this._glow.alpha = strength * GLOW.maxAlpha;
  }

  release(pocket: Vec2, layoutScale: number): void {
    this._pocket = { kind: 'returning', position: pocket, speed: RETURN_SPEED * layoutScale };
    this.drawBands(pocket);
    this.setAimVisible(false);
    this._glow.alpha = 0;
  }

  update(deltaSeconds: number): void {
    if (this._pocket.kind !== 'returning') {
      return;
    }

    const remaining = distance(this._pocket.position, this._anchor);
    const step = this._pocket.speed * deltaSeconds;
    const position = remaining <= step ? this._anchor : add(this._pocket.position, scale(subtract(this._anchor, this._pocket.position), step / remaining));
    this._pocket = position === this._anchor ? { kind: 'held', position } : { ...this._pocket, position };
    this.drawBands(position);
  }

  private holdPocket(pocket: Vec2): void {
    this._pocket = { kind: 'held', position: pocket };
    this.drawBands(pocket);
  }

  private drawBands(pocket: Vec2): void {
    this._leftBand.stretch(vec2(this._leftPost.x, this._leftPost.y), pocket);
    this._rightBand.stretch(vec2(this._rightPost.x, this._rightPost.y), pocket);
  }

  private setAimVisible(isVisible: boolean): void {
    this._aimFront.visible = isVisible;
    this._aimBack.visible = isVisible;
  }

  private order(...entries: readonly (readonly [Container, number])[]): void {
    entries.forEach(([part, order]) => (part.zIndex = sortOrder(order)));
  }
}
