import { Container, Graphics } from 'pixi.js';
import { yMax } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';

/**
 * Root of everything drawn in the world. Its transform is the camera: children use world units with Y up, exactly
 * like the Unity scene, and the stage maps them to screen pixels. A mask keeps landscape pillarbox bars empty.
 */
export class WorldStage extends Container {
  readonly world = new Container({ sortableChildren: true });
  private readonly _clip = new Graphics();

  constructor() {
    super();
    this.world.mask = this._clip;
    this.addChild(this.world, this._clip);
  }

  applyLayout(layout: ViewportLayout): void {
    const { viewport, visibleRect, pixelsPerUnit } = layout;
    this.world.position.set(viewport.x - visibleRect.xMin * pixelsPerUnit, viewport.y + yMax(visibleRect) * pixelsPerUnit);
    this.world.scale.set(pixelsPerUnit, -pixelsPerUnit);
    this._clip.clear().rect(viewport.x, viewport.y, viewport.width, viewport.height).fill(0xffffff);
  }
}
