import { Container, Graphics } from 'pixi.js';
import { yMax } from '../../core/math/Rect';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import { createWorldLayers, type WorldLayers } from './WorldLayers';

/**
 * Root of everything drawn in the world. Its transform is the camera: children use world units with Y up, exactly
 * like the Unity scene, and the stage maps them to screen pixels. A mask keeps landscape pillarbox bars empty.
 * Objects join one of the three `layers`.
 */
export class WorldStage extends Container {
  readonly layers: WorldLayers = createWorldLayers();
  private readonly _world = new Container();
  private readonly _clip = new Graphics();

  constructor() {
    super();
    this._world.addChild(this.layers.background, this.layers.gameplay, this.layers.foreground);
    this._world.mask = this._clip;
    this.addChild(this._world, this._clip);
  }

  applyLayout(layout: ViewportLayout): void {
    const { viewport, visibleRect, pixelsPerUnit } = layout;
    this._world.position.set(viewport.x - visibleRect.xMin * pixelsPerUnit, viewport.y + yMax(visibleRect) * pixelsPerUnit);
    this._world.scale.set(pixelsPerUnit, -pixelsPerUnit);
    this._clip.clear().rect(viewport.x, viewport.y, viewport.width, viewport.height).fill(0xffffff);
  }
}
