import type { IRandom } from '../core/random/IRandom';
import { parseLevel } from '../domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../domain/level/openingLevel';
import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import { BoardSystem } from '../game/board/BoardSystem';
import type { ITextureSource } from '../view/assets/ITextureSource';
import { BubbleLayer } from '../view/bubble/BubbleLayer';
import { SceneView } from '../view/scene/SceneView';

/** The running game: scene, board and the systems between them. Created once the first layout is known. */
export class Playable {
  readonly scene: SceneView;
  private readonly _bubbles: BubbleLayer;
  private readonly _board: BoardSystem;

  constructor(textures: ITextureSource, random: IRandom, layout: ViewportLayout) {
    this.scene = new SceneView(textures, random);
    this._bubbles = new BubbleLayer(textures, this.scene.world);
    this.scene.applyLayout(layout);
    this._board = new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), this._bubbles, layout.designRect);
  }

  applyLayout(layout: ViewportLayout): void {
    this.scene.applyLayout(layout);
    this._board.applyLayout(layout.designRect);
  }

  update(deltaSeconds: number): void {
    this.scene.update(deltaSeconds);
    this._bubbles.update(deltaSeconds);
  }
}
