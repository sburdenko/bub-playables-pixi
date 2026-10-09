import type { IRandom } from '../core/random/IRandom';
import { parseLevel } from '../domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../domain/level/openingLevel';
import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import { BoardSystem } from '../game/board/BoardSystem';
import { TurnFlow, type IAttack } from '../game/flow/TurnFlow';
import { LauncherSystem } from '../game/launcher/LauncherSystem';
import type { IBubbleView } from '../game/ports/IBubbleView';
import type { IPointerSource } from '../game/ports/IPointerSource';
import type { ITextureSource } from '../view/assets/ITextureSource';
import { BubbleLayer } from '../view/bubble/BubbleLayer';
import { SlingView } from '../view/launcher/SlingView';
import { SceneView } from '../view/scene/SceneView';

/** Placeholder until the match attack sequence: matched bubbles simply disappear. */
const POP_ATTACK: IAttack = {
  play: (matched: readonly IBubbleView[]) => matched.forEach((bubble) => bubble.destroy()),
  update: () => true,
};

/** The running game: scene, board, sling and the turn that drives them. Created once the first layout is known. */
export class Playable {
  readonly scene: SceneView;
  private readonly _bubbles: BubbleLayer;
  private readonly _sling: SlingView;
  private readonly _board: BoardSystem;
  private readonly _launcher: LauncherSystem;
  private readonly _turn: TurnFlow;

  constructor(textures: ITextureSource, random: IRandom, pointer: IPointerSource, layout: ViewportLayout) {
    this.scene = new SceneView(textures, random);
    this._bubbles = new BubbleLayer(textures, this.scene.world);
    this._sling = new SlingView(textures);
    this.scene.world.addChild(...this._sling.parts);
    this._board = new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), this._bubbles, layout.designRect);
    this._launcher = new LauncherSystem(this._sling);
    this._turn = new TurnFlow(this._board, this._launcher, POP_ATTACK, pointer, random);
    this.applyLayout(layout);
  }

  applyLayout(layout: ViewportLayout): void {
    this.scene.applyLayout(layout);
    this._board.applyLayout(layout.designRect);
    this._launcher.applyLayout(layout.visibleRect, this._board.geometry.scale);
  }

  update(deltaSeconds: number): void {
    this._turn.update(deltaSeconds);
    this.scene.update(deltaSeconds);
    this._sling.update(deltaSeconds);
    this._bubbles.update(deltaSeconds);
  }
}
