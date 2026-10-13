import type { IRandom } from '../../core/random/IRandom';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { BackgroundView } from '../layout/BackgroundView';
import { BottomView } from '../layout/BottomView';
import { FrameView } from '../layout/FrameView';
import { WorldStage } from './WorldStage';

/** The scene dressing: background, frame, and the bottom panel with both characters. */
export class SceneView extends WorldStage {
  readonly bottom: BottomView;
  private readonly _background: BackgroundView;
  private readonly _frame: FrameView;

  constructor(textures: ITextureSource, random: IRandom) {
    super();
    this._background = new BackgroundView(textures);
    this._frame = new FrameView(textures);
    this.bottom = new BottomView(textures, random);
    this.layers.background.addChild(this._background);
    this.layers.gameplay.addChild(...this.bottom.parts, this._frame);
  }

  override applyLayout(layout: ViewportLayout): void {
    super.applyLayout(layout);
    this._background.applyLayout(layout);
    this._frame.applyLayout(layout);
    this.bottom.applyLayout(layout);
  }

  update(deltaSeconds: number): void {
    this.bottom.update(deltaSeconds);
  }
}
