import type { BubbleColor } from '../../domain/board/BubbleColor';
import type { IBubbleViewFactory } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import type { WorldLayers } from '../scene/WorldLayers';
import type { EffectsLayer } from '../vfx/EffectsLayer';
import { BubbleView } from './BubbleView';

/** Creates bubble views in the world layers and advances their animations every frame. */
export class BubbleLayer implements IBubbleViewFactory {
  private readonly _textures: ITextureSource;
  private readonly _layers: WorldLayers;
  private readonly _effects: EffectsLayer;
  private _views: readonly BubbleView[] = [];

  constructor(textures: ITextureSource, layers: WorldLayers, effects: EffectsLayer) {
    this._textures = textures;
    this._layers = layers;
    this._effects = effects;
  }

  create(color: BubbleColor): BubbleView {
    const view = new BubbleView(this._textures, color, this._layers, this._effects);
    this._views = [...this._views, view];

    return view;
  }

  update(deltaSeconds: number): void {
    this._views = this._views.filter((view) => !view.isDestroyed);
    this._views.forEach((view) => view.update(deltaSeconds));
  }
}
