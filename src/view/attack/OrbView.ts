import type { Vec2 } from '../../core/math/Vec2';
import type { IOrbView } from '../../game/ports/IAttackViews';
import type { ITextureSource } from '../assets/ITextureSource';
import { sortOrder } from '../scene/sortOrder';
import { WorldSprite } from '../scene/WorldSprite';

/** The attack orb: hidden until a match, drawn above everything. */
export class OrbView extends WorldSprite implements IOrbView {
  constructor(textures: ITextureSource) {
    super(textures, 't-vfx-attackflow-01-y');
    this.zIndex = sortOrder(0, 'top');
    this.visible = false;
  }

  show(position: Vec2): void {
    this.moveTo(position);
    this.visible = true;
  }

  moveTo(position: Vec2): void {
    this.position.set(position.x, position.y);
  }

  setScale(scale: number): void {
    this.scale.set(scale);
  }

  hide(): void {
    this.visible = false;
  }
}
