import type { Container } from 'pixi.js';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import type { IBubbleViewFactory } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import type { EffectsLayer } from '../vfx/EffectsLayer';
import { BubbleView } from './BubbleView';

/** Creates bubble views in the world and advances their animations every frame. */
export class BubbleLayer implements IBubbleViewFactory {
  private readonly _textures: ITextureSource;
  private readonly _world: Container;
  private readonly _effects: EffectsLayer;
  private _views: readonly BubbleView[] = [];

  constructor(textures: ITextureSource, world: Container, effects: EffectsLayer) {
    this._textures = textures;
    this._world = world;
    this._effects = effects;
  }

  create(color: BubbleColor): BubbleView {
    const view = new BubbleView(this._textures, color, this._world, this._effects);
    this._views = [...this._views, view];

    return view;
  }

  update(deltaSeconds: number): void {
    this._views = this._views.filter((view) => !view.isDestroyed);
    this._views.forEach((view) => view.update(deltaSeconds));
  }
}
