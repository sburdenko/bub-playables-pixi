import type { IRandom } from '../../core/random/IRandom';
import type { ViewportLayout } from '../../domain/layout/ViewportLayout';
import type { ITextureSource } from '../assets/ITextureSource';
import { BackgroundView } from '../layout/BackgroundView';
import { BottomView } from '../layout/BottomView';
import { FrameView } from '../layout/FrameView';
import { TopBarView } from '../layout/TopBarView';
import { WorldStage } from './WorldStage';

/** The static scene dressing: background, frame, bottom panel with both characters, and the top bar. */
export class SceneView extends WorldStage {
  readonly bottom: BottomView;
  private readonly _background: BackgroundView;
  private readonly _frame: FrameView;
  private readonly _topBar: TopBarView;

  constructor(textures: ITextureSource, random: IRandom) {
    super();
    this._background = new BackgroundView(textures);
    this._frame = new FrameView(textures);
    this._topBar = new TopBarView(textures);
    this.bottom = new BottomView(textures, random);
    this.world.addChild(this._background, ...this.bottom.parts, this._frame, this._topBar);
  }

  override applyLayout(layout: ViewportLayout): void {
    super.applyLayout(layout);
    this._background.applyLayout(layout);
    this._frame.applyLayout(layout);
    this._topBar.applyLayout(layout);
    this.bottom.applyLayout(layout);
  }

  update(deltaSeconds: number): void {
    this.bottom.update(deltaSeconds);
  }
}
