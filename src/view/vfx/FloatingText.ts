import { Color, Text } from 'pixi.js';
import { clamp01, lerp } from '../../core/math/Scalar';
import type { Vec2 } from '../../core/math/Vec2';
import type { TextKind } from '../../game/ports/IAttackViews';
import { sortOrder } from '../scene/sortOrder';

const FONT_FAMILY = 'Comic Roasting';
const FONT_PIXELS = 100;
const SORT_ORDER = 71;

type FloatingTextStyle = {
  readonly prefix: string;
  /** Line height in world units at layout scale 1 (Unity TextMesh: characterSize × fontSize / 10). */
  readonly height: number;
  readonly outlineColor: number;
  readonly outlineOffset: number;
  readonly lifetime: number;
  readonly rise: number;
  readonly startScale: number;
  readonly endScale: number;
  readonly startColor: number;
  readonly endColor: number;
};

/** The two number styles from the Unity prefabs PB_UI_BubbleScoreText and PB_UI_EnemyDamageText. */
const STYLES: Readonly<Record<TextKind, FloatingTextStyle>> = {
  score: { prefix: '+', height: 0.5, outlineColor: 0x1a0a00, outlineOffset: 0.02, lifetime: 1, rise: 0.55, startScale: 1, endScale: 0.9, startColor: 0xffffff, endColor: 0x959595 },
  damage: { prefix: '-', height: 0.8, outlineColor: 0x000000, outlineOffset: 0.06, lifetime: 1, rise: 0.6, startScale: 1.05, endScale: 0.92, startColor: 0xff2800, endColor: 0xbf2e24 },
};

/** An outlined number that rises, shrinks and fades out. */
export class FloatingText extends Text {
  private readonly _look: FloatingTextStyle;
  private readonly _start: Vec2;
  private readonly _layoutScale: number;
  private _age = 0;

  constructor(kind: TextKind, position: Vec2, value: number, layoutScale: number) {
    const style = STYLES[kind];
    const pixelsPerUnit = FONT_PIXELS / style.height;
    super({
      text: `${style.prefix}${value}`,
      style: { fontFamily: FONT_FAMILY, fontSize: FONT_PIXELS, fill: 0xffffff, stroke: { color: style.outlineColor, width: style.outlineOffset * 2 * pixelsPerUnit, join: 'round' } },
      anchor: 0.5,
      resolution: 2,
    });
    this._look = style;
    this._start = position;
    this._layoutScale = layoutScale;
    this.zIndex = sortOrder(SORT_ORDER, 'top');
    this.apply(0);
  }

  get isFinished(): boolean {
    return this._age >= this._look.lifetime;
  }

  update(deltaSeconds: number): void {
    this._age += deltaSeconds;
    this.apply(clamp01(this._age / this._look.lifetime));
  }

  private apply(progress: number): void {
    const unitsPerPixel = (this._look.height / FONT_PIXELS) * lerp(this._look.startScale, this._look.endScale, progress) * this._layoutScale;
    this.position.set(this._start.x, this._start.y + this._look.rise * this._layoutScale * progress);
    this.scale.set(unitsPerPixel, -unitsPerPixel);
    this.tint = blend(this._look.startColor, this._look.endColor, progress);
    this.alpha = 1 - progress;
  }
}

function blend(from: number, to: number, t: number): number {
  const [r0, g0, b0] = new Color(from).toArray();
  const [r1, g1, b1] = new Color(to).toArray();

  return new Color([lerp(r0 ?? 0, r1 ?? 0, t), lerp(g0 ?? 0, g1 ?? 0, t), lerp(b0 ?? 0, b1 ?? 0, t)]).toNumber();
}
