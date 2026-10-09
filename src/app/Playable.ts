import type { IRandom } from '../core/random/IRandom';
import { parseLevel } from '../domain/level/Level';
import { OPENING_LEVEL_ROWS } from '../domain/level/openingLevel';
import type { ViewportLayout } from '../domain/layout/ViewportLayout';
import { MatchAttackSequence } from '../game/attack/MatchAttackSequence';
import { BoardSystem } from '../game/board/BoardSystem';
import { TurnFlow } from '../game/flow/TurnFlow';
import { LauncherSystem } from '../game/launcher/LauncherSystem';
import type { IPointerSource } from '../game/ports/IPointerSource';
import type { ITextureSource } from '../view/assets/ITextureSource';
import { OrbView } from '../view/attack/OrbView';
import { BubbleLayer } from '../view/bubble/BubbleLayer';
import { SlingView } from '../view/launcher/SlingView';
import { SceneView } from '../view/scene/SceneView';
import { EffectsLayer } from '../view/vfx/EffectsLayer';

/** The running game: scene, board, sling, attack and the turn that drives them. Created once the first layout is known. */
export class Playable {
  readonly scene: SceneView;
  private readonly _effects: EffectsLayer;
  private readonly _bubbles: BubbleLayer;
  private readonly _sling: SlingView;
  private readonly _board: BoardSystem;
  private readonly _launcher: LauncherSystem;
  private readonly _turn: TurnFlow;

  constructor(textures: ITextureSource, random: IRandom, pointer: IPointerSource, layout: ViewportLayout) {
    this.scene = new SceneView(textures, random);
    this._effects = new EffectsLayer(textures, this.scene.world, random);
    this._bubbles = new BubbleLayer(textures, this.scene.world, this._effects);
    this._sling = new SlingView(textures);
    const orb = new OrbView(textures);
    this.scene.world.addChild(...this._sling.parts, orb);
    this._board = new BoardSystem(parseLevel(OPENING_LEVEL_ROWS), this._bubbles, layout.designRect);
    this._launcher = new LauncherSystem(this._sling);
    const attack = new MatchAttackSequence(orb, this.scene.bottom.enemy, this._effects);
    this._turn = new TurnFlow(this._board, this._launcher, attack, pointer, random);
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
    this._effects.update(deltaSeconds);
  }
}
