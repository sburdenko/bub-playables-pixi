import { RecyclingPool } from '../../core/pool/RecyclingPool';
import type { BubbleColor } from '../../domain/board/BubbleColor';
import type { IBubbleViewFactory } from '../../game/ports/IBubbleView';
import type { ITextureSource } from '../assets/ITextureSource';
import type { WorldLayers } from '../scene/WorldLayers';
import type { EffectsLayer } from '../vfx/EffectsLayer';
import { BubbleView } from './BubbleView';

/** Hands out bubble views (recycling the finished ones) and advances their animations every frame. */
export class BubbleLayer implements IBubbleViewFactory {
  private readonly _views: RecyclingPool<BubbleColor, BubbleView>;

  constructor(textures: ITextureSource, layers: WorldLayers, effects: EffectsLayer) {
    this._views = new RecyclingPool<BubbleColor, BubbleView>(
      (color) => new BubbleView(textures, color, layers, effects),
      (view) => view.reset(),
      (view) => view.color,
    );
  }

  create(color: BubbleColor): BubbleView {
    const view = this._views.acquire(color);
    view.activate();

    return view;
  }

  update(deltaSeconds: number): void {
    this._views.sweep();
    this._views.active.forEach((view) => view.update(deltaSeconds));
  }
}
