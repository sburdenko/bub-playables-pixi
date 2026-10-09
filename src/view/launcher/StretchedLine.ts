import { Color, Container, FillGradient, Graphics, Sprite, type Texture } from 'pixi.js';
import type { Vec2 } from '../../core/math/Vec2';

/**
 * A line between two world points, built once along the unit X axis and stretched each frame with its transform,
 * so moving it never rebuilds geometry or gradients. Width stays in world units.
 */
export class StretchedLine extends Container {
  stretch(from: Vec2, to: Vec2): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    this.position.set(from.x, from.y);
    this.rotation = Math.atan2(dy, dx);
    this.scale.set(Math.hypot(dx, dy), 1);
  }
}

export type TaperStyle = {
  readonly startWidth: number;
  readonly endWidth: number;
  readonly color: number;
  readonly startAlpha: number;
  readonly endAlpha: number;
};

/** Unity LineRenderer look: width and alpha change from start to end. */
export class TaperedLine extends StretchedLine {
  private readonly _shape = new Graphics();
  private _style: TaperStyle;

  constructor(style: TaperStyle) {
    super();
    this._style = style;
    this.addChild(this._shape);
    this.draw();
  }

  setColor(color: number): void {
    this._style = { ...this._style, color };
    this.draw();
  }

  private draw(): void {
    const { startWidth, endWidth, color, startAlpha, endAlpha } = this._style;
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: new Color(color).setAlpha(startAlpha) },
        { offset: 1, color: new Color(color).setAlpha(endAlpha) },
      ],
    });
    this._shape.clear().poly([0, -startWidth / 2, 1, -endWidth / 2, 1, endWidth / 2, 0, startWidth / 2]).fill(gradient);
  }
}

/** A texture stretched along the line (Unity LineRenderer "Stretch" texture mode). */
export class TexturedLine extends StretchedLine {
  constructor(texture: Texture, width: number, tint: number, alpha: number) {
    super();
    const sprite = new Sprite(texture);
    sprite.anchor.set(0, 0.5);
    sprite.setSize(1, width);
    sprite.tint = tint;
    sprite.alpha = alpha;
    this.addChild(sprite);
  }
}
